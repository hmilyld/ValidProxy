"""代理验证模块 - 并发异步验证"""

import asyncio
import logging
import math
import time
from typing import Callable, Optional

import httpx
from sqlalchemy import select

from app.config import VALIDATION_CONCURRENCY, VALIDATION_TIMEOUT, VALIDATION_URLS
from app.database import async_session, utcnow
from app.models import Proxy

logger = logging.getLogger(__name__)

# 当前可用的验证 URL 索引（支持故障切换）
_current_url_index = 0
_url_failures = [0] * len(VALIDATION_URLS)

# 批量写库大小（减少 SQLite 写锁竞争与连接池排队）
DB_WRITE_BATCH_SIZE = 100


def _get_next_url() -> str:
    """获取下一个可用的验证 URL，支持故障切换"""
    global _current_url_index
    # 如果当前 URL 连续失败 3 次，切换到下一个
    if _url_failures[_current_url_index] >= 3:
        _url_failures[_current_url_index] = 0
        _current_url_index = (_current_url_index + 1) % len(VALIDATION_URLS)
        logger.info("切换验证 URL: %s", VALIDATION_URLS[_current_url_index])
    return VALIDATION_URLS[_current_url_index]


def _record_url_failure(url: str):
    """记录 URL 失败"""
    try:
        idx = VALIDATION_URLS.index(url)
        _url_failures[idx] += 1
    except ValueError:
        pass


def _record_url_success(url: str):
    """记录 URL 成功"""
    try:
        idx = VALIDATION_URLS.index(url)
        _url_failures[idx] = 0
    except ValueError:
        pass


async def validate_single_proxy(proxy_url: str, url: Optional[str] = None) -> tuple[bool, float]:
    """验证单个代理地址，返回 (success, response_time_ms)"""
    url = url or _get_next_url()
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=VALIDATION_TIMEOUT, proxy=proxy_url) as client:
            # asyncio.wait_for 兜底：httpx 的 timeout 不覆盖 DNS 解析（worker 线程），防止线程卡死导致任务挂起
            resp = await asyncio.wait_for(client.get(url, follow_redirects=True), timeout=VALIDATION_TIMEOUT)
        elapsed_ms = (time.monotonic() - start) * 1000
        success = resp.status_code == 200
        if success:
            _record_url_success(url)
            logger.debug("✓ %s - %.0fms", proxy_url, elapsed_ms)
        else:
            _record_url_failure(url)
        return success, elapsed_ms
    except (asyncio.TimeoutError, httpx.TimeoutException):
        _record_url_failure(url)
        return False, (time.monotonic() - start) * 1000
    except Exception:
        _record_url_failure(url)
        return False, (time.monotonic() - start) * 1000


async def _validate_proxy(proxy: Proxy) -> tuple[bool, float]:
    """验证数据库中的单个代理，返回 (success, response_time_ms)"""
    return await validate_single_proxy(proxy.proxy)


async def validate_all(progress_callback: Optional[Callable] = None) -> dict:
    """批量验证所有代理：HTTP 检查并发执行，DB 更新批量落库"""
    async with async_session() as db:
        result = await db.execute(select(Proxy))
        proxies = list(result.scalars().all())
    total = len(proxies)
    logger.info("开始验证 %d 个代理...", total)
    if total == 0:
        return {"total": 0, "validated": 0, "success": 0}

    semaphore = asyncio.Semaphore(VALIDATION_CONCURRENCY)

    async def _check(proxy: Proxy) -> tuple[bool, float]:
        async with semaphore:
            return await _validate_proxy(proxy)

    # (proxy_id, ok, response_time_ms)
    results: list[tuple[int, bool, float]] = []

    async def _run_checks():
        for i in range(0, total, VALIDATION_CONCURRENCY):
            batch = proxies[i : i + VALIDATION_CONCURRENCY]
            batch_results = await asyncio.gather(*(_check(p) for p in batch))
            results.extend((p.id, ok, rt) for p, (ok, rt) in zip(batch, batch_results))
            if progress_callback:
                await progress_callback(len(results), total, sum(1 for _, ok, _ in results if ok))

    # 整体超时兜底：按批次上限估算（单代理上限 + 余量），防止意外挂起
    overall_timeout = math.ceil(total / VALIDATION_CONCURRENCY) * (VALIDATION_TIMEOUT + 2)
    logger.info("验证阶段整体超时上限: %.0f 秒", overall_timeout)
    try:
        await asyncio.wait_for(_run_checks(), timeout=overall_timeout)
    except asyncio.TimeoutError:
        logger.error("验证阶段整体超时（%.0f 秒），提前结束并保留已完成的结果", overall_timeout)

    validated = len(results)
    success = sum(1 for _, ok, _ in results if ok)
    logger.info("HTTP 验证完成: 共 %d 个, 成功 %d 个", validated, success)

    # 批量写库（单 session、周期提交，降低并发写压力）
    updated = 0
    async with async_session() as db:
        for start in range(0, len(results), DB_WRITE_BATCH_SIZE):
            chunk = results[start : start + DB_WRITE_BATCH_SIZE]
            for pid, ok, resp_time in chunk:
                p = await db.get(Proxy, pid)
                if not p:
                    continue
                p.total_checks += 1
                p.last_checked_at = utcnow()
                p.response_time_ms = round(resp_time, 1)
                if ok:
                    p.success_checks += 1
                    p.consecutive_successes += 1
                    p.consecutive_failures = 0
                    p.last_success_at = utcnow()
                else:
                    p.consecutive_successes = 0
                    p.consecutive_failures += 1
                p.success_rate = round(p.success_checks / p.total_checks, 4) if p.total_checks > 0 else 0.0
                p.updated_at = utcnow()
                updated += 1
            await db.commit()

    logger.info("验证完成: 共 %d 个, 成功 %d 个, 落库 %d 条", validated, success, updated)
    return {"total": total, "validated": validated, "success": success}
