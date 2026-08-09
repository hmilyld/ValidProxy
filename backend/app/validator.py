"""代理验证模块 - 并发异步验证"""

import asyncio
import logging
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


async def _validate_proxy(proxy: Proxy) -> tuple[bool, float]:
    """验证单个代理，返回 (success, response_time_ms)"""
    url = _get_next_url()
    start = time.monotonic()
    try:
        async with httpx.AsyncClient(timeout=VALIDATION_TIMEOUT, proxy=proxy.proxy) as client:
            resp = await client.get(url, follow_redirects=True)
        elapsed_ms = (time.monotonic() - start) * 1000
        success = resp.status_code == 200
        if success:
            _record_url_success(url)
            logger.debug("✓ %s - %.0fms", proxy.proxy, elapsed_ms)
        else:
            _record_url_failure(url)
        return success, elapsed_ms
    except httpx.TimeoutException:
        _record_url_failure(url)
        return False, (time.monotonic() - start) * 1000
    except Exception:
        _record_url_failure(url)
        return False, (time.monotonic() - start) * 1000


async def validate_all(progress_callback: Optional[Callable] = None) -> dict:
    """批量验证所有代理"""
    async with async_session() as db:
        result = await db.execute(select(Proxy))
        proxies = result.scalars().all()
    total = len(proxies)
    logger.info("开始验证 %d 个代理...", total)

    validated = 0
    success = 0
    semaphore = asyncio.Semaphore(VALIDATION_CONCURRENCY)

    async def _limited_validate(proxy: Proxy):
        nonlocal validated, success
        async with semaphore:
            ok, resp_time = await _validate_proxy(proxy)

            # 每个任务使用独立的会话更新数据库，避免共享会话并发访问
            async with async_session() as s:
                p = await s.get(Proxy, proxy.id)
                if p:
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
                await s.commit()

            validated += 1
            if ok:
                success += 1

            if progress_callback and validated % 100 == 0:
                logger.info("进度: %d/%d (成功: %d, 失败: %d)", validated, total, success, validated - success)
                await progress_callback(validated, total, success)

    # 分批并发验证（每批不超过并发上限）
    tasks = [_limited_validate(p) for p in proxies]
    for i in range(0, len(tasks), VALIDATION_CONCURRENCY):
        await asyncio.gather(*tasks[i : i + VALIDATION_CONCURRENCY])

    logger.info("验证完成: 共 %d 个, 成功 %d 个", total, success)
    return {"total": total, "validated": validated, "success": success}
