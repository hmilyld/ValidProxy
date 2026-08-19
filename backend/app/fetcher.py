"""代理列表获取模块"""

import asyncio
import logging

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import MAX_CONSECUTIVE_FAILURES, PROXY_SOURCE_URL
from app.database import utcnow
from app.models import Proxy

logger = logging.getLogger(__name__)

# 远程获取阶段超时（秒）
FETCH_REQUEST_TIMEOUT_SECONDS = 30


async def fetch_remote_proxies() -> list[dict]:
    """从远程获取代理列表"""
    timeout = httpx.Timeout(FETCH_REQUEST_TIMEOUT_SECONDS, connect=10.0)
    async with httpx.AsyncClient(timeout=timeout) as client:
        # asyncio.wait_for 兜底：httpx 的 timeout 不覆盖 DNS 解析（worker 线程），防止线程卡死导致任务挂起
        resp = await asyncio.wait_for(client.get(PROXY_SOURCE_URL), timeout=FETCH_REQUEST_TIMEOUT_SECONDS)
        resp.raise_for_status()
        return resp.json()


async def sync_proxies(db: AsyncSession) -> dict:
    """同步代理列表到数据库，返回统计"""
    logger.info("开始获取远程代理列表...")
    remote_proxies = await fetch_remote_proxies()
    logger.info("远程获取到 %d 个代理", len(remote_proxies))

    stats = {"added": 0, "updated": 0, "unchanged": 0}

    # 一次性加载现有代理，避免循环内逐条查询（大量代理时明显降低耗时与锁竞争）
    result = await db.execute(select(Proxy.proxy, Proxy))
    existing = {row[0]: row[1] for row in result.all()}

    for p in remote_proxies:
        proxy_addr = p.get("proxy", "")
        if not proxy_addr:
            continue

        geo = p.get("geolocation") or {}
        cur = existing.get(proxy_addr)
        if cur is not None:
            # 更新非验证相关字段
            cur.protocol = p.get("protocol", cur.protocol)
            cur.ip = p.get("ip", cur.ip)
            cur.port = p.get("port", cur.port)
            cur.country = geo.get("country", cur.country)
            cur.city = geo.get("city", cur.city)
            cur.anonymity = p.get("anonymity", cur.anonymity)
            cur.https = p.get("https", cur.https)
            cur.updated_at = utcnow()
            stats["updated"] += 1
        else:
            new_proxy = Proxy(
                proxy=proxy_addr,
                protocol=p.get("protocol", "http"),
                ip=p.get("ip", ""),
                port=p.get("port", 0),
                country=geo.get("country", "Unknown"),
                city=geo.get("city", "Unknown"),
                anonymity=p.get("anonymity", "transparent"),
                https=p.get("https", False),
            )
            db.add(new_proxy)
            existing[proxy_addr] = new_proxy  # 合并远端列表内重复地址
            stats["added"] += 1

    await db.commit()
    logger.info("同步完成: 新增 %d, 更新 %d", stats["added"], stats["updated"])
    return stats


async def cleanup_failed_proxies(db: AsyncSession) -> int:
    """清理连续失败达到阈值的代理"""
    result = await db.execute(delete(Proxy).where(Proxy.consecutive_failures >= MAX_CONSECUTIVE_FAILURES))
    deleted = result.rowcount
    await db.commit()
    if deleted > 0:
        logger.info("清理失效代理: 删除 %d 个（连续失败 >= %d 次）", deleted, MAX_CONSECUTIVE_FAILURES)
    return deleted
