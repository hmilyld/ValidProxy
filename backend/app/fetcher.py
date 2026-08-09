"""代理列表获取模块"""

import logging
from datetime import datetime

import httpx
from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import MAX_CONSECUTIVE_FAILURES, PROXY_SOURCE_URL
from app.models import Proxy

logger = logging.getLogger(__name__)


async def fetch_remote_proxies() -> list[dict]:
    """从远程获取代理列表"""
    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.get(PROXY_SOURCE_URL)
        resp.raise_for_status()
        return resp.json()


async def sync_proxies(db: AsyncSession) -> dict:
    """同步代理列表到数据库，返回统计"""
    logger.info("开始获取远程代理列表...")
    remote_proxies = await fetch_remote_proxies()
    logger.info(f"远程获取到 {len(remote_proxies)} 个代理")

    stats = {"added": 0, "updated": 0, "unchanged": 0}

    for p in remote_proxies:
        proxy_addr = p.get("proxy", "")
        if not proxy_addr:
            continue

        result = await db.execute(select(Proxy).where(Proxy.proxy == proxy_addr))
        existing = result.scalar_one_or_none()

        if existing:
            # 更新非验证相关字段
            existing.protocol = p.get("protocol", existing.protocol)
            existing.ip = p.get("ip", existing.ip)
            existing.port = p.get("port", existing.port)
            existing.country = p.get("geolocation", {}).get("country", existing.country)
            existing.city = p.get("geolocation", {}).get("city", existing.city)
            existing.anonymity = p.get("anonymity", existing.anonymity)
            existing.https = p.get("https", existing.https)
            existing.updated_at = datetime.utcnow()
            stats["updated"] += 1
        else:
            new_proxy = Proxy(
                proxy=proxy_addr,
                protocol=p.get("protocol", "http"),
                ip=p.get("ip", ""),
                port=p.get("port", 0),
                country=p.get("geolocation", {}).get("country", "Unknown"),
                city=p.get("geolocation", {}).get("city", "Unknown"),
                anonymity=p.get("anonymity", "transparent"),
                https=p.get("https", False),
            )
            db.add(new_proxy)
            stats["added"] += 1

    await db.commit()
    logger.info(f"同步完成: 新增 {stats['added']}, 更新 {stats['updated']}")
    return stats


async def cleanup_failed_proxies(db: AsyncSession) -> int:
    """清理连续失败超过阈值的代理"""
    result = await db.execute(
        delete(Proxy).where(
            Proxy.consecutive_successes == 0,
            Proxy.total_checks >= MAX_CONSECUTIVE_FAILURES,
            Proxy.success_checks == 0,
        )
    )
    deleted = result.rowcount
    await db.commit()
    if deleted > 0:
        logger.info(f"清理失效代理: 删除 {deleted} 个（连续 {MAX_CONSECUTIVE_FAILURES} 次失败）")
    return deleted
