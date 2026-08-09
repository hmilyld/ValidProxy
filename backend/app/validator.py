"""代理验证模块 - 50 并发异步验证"""

import asyncio
import logging
import time
from datetime import datetime
from typing import Callable, Optional

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import VALIDATION_CONCURRENCY, VALIDATION_TIMEOUT, VALIDATION_URLS
from app.models import Proxy

logger = logging.getLogger(__name__)

# 当前可用的验证 URL 索引
_current_url_index = 0
_url_failures = [0] * len(VALIDATION_URLS)


def _get_next_url() -> str:
    """获取下一个可用的验证 URL，支持故障切换"""
    global _current_url_index
    # 如果当前 URL 连续失败 3 次，切换到下一个
    if _url_failures[_current_url_index] >= 3:
        _url_failures[_current_url_index] = 0
        _current_url_index = (_current_url_index + 1) % len(VALIDATION_URLS)
        logger.info(f"切换验证 URL: {VALIDATION_URLS[_current_url_index]}")
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


async def _validate_single(
    proxy: Proxy, client: httpx.AsyncClient
) -> tuple[int, bool, float, Optional[str]]:
    """验证单个代理，返回 (proxy_id, success, response_time_ms, error)"""
    url = _get_next_url()
    try:
        start = time.monotonic()
        resp = await client.get(url, follow_redirects=True)
        elapsed_ms = (time.monotonic() - start) * 1000
        success = resp.status_code == 200
        error = None if success else f"HTTP {resp.status_code}"
        if success:
            _record_url_success(url)
            logger.debug(f"✓ {proxy.proxy} - {elapsed_ms:.0f}ms")
        else:
            _record_url_failure(url)
        return (proxy.id, success, elapsed_ms, error)
    except httpx.TimeoutException:
        elapsed_ms = (time.monotonic() - start) * 1000
        _record_url_failure(url)
        return (proxy.id, False, elapsed_ms, "Timeout")
    except Exception as e:
        elapsed_ms = (time.monotonic() - start) * 1000
        _record_url_failure(url)
        return (proxy.id, False, elapsed_ms, str(type(e).__name__))


async def validate_all(
    db: AsyncSession,
    progress_callback: Optional[Callable] = None,
) -> dict:
    """批量验证所有代理"""
    # 获取所有代理
    result = await db.execute(select(Proxy))
    proxies = result.scalars().all()
    total = len(proxies)
    logger.info(f"开始验证 {total} 个代理...")

    validated = 0
    success = 0
    semaphore = asyncio.Semaphore(VALIDATION_CONCURRENCY)

    async def _limited_validate(proxy: Proxy):
        nonlocal validated, success
        async with semaphore:
            try:
                async with httpx.AsyncClient(
                    timeout=VALIDATION_TIMEOUT,
                    proxy=proxy.proxy,
                ) as proxy_client:
                    proxy_id, ok, resp_time, error = await _validate_single(proxy, proxy_client)
            except Exception as e:
                proxy_id, ok, resp_time, error = proxy.id, False, 0, str(type(e).__name__)

            validated += 1
            if ok:
                success += 1

            # 更新数据库
            p = await db.get(Proxy, proxy_id)
            if p:
                p.total_checks += 1
                p.last_checked_at = datetime.utcnow()
                p.response_time_ms = round(resp_time, 1)
                if ok:
                    p.success_checks += 1
                    p.consecutive_successes += 1
                    p.last_success_at = datetime.utcnow()
                else:
                    p.consecutive_successes = 0
                p.success_rate = round(p.success_checks / p.total_checks, 4) if p.total_checks > 0 else 0
                p.updated_at = datetime.utcnow()

            # 进度回调
            if progress_callback and validated % 100 == 0:
                logger.info(f"进度: {validated}/{total} (成功: {success}, 失败: {validated - success})")
                await progress_callback(validated, total, success)

    # 批量验证
    tasks = [_limited_validate(p) for p in proxies]
    for i in range(0, len(tasks), 100):
        batch = tasks[i : i + 100]
        await asyncio.gather(*batch)
        await db.commit()
        logger.info(f"进度: {validated}/{total} (成功: {success})")

    await db.commit()

    stats = {"total": total, "validated": validated, "success": success}
    logger.info(f"验证完成: {stats}")
    return stats
