"""定时调度模块 - 每小时获取并验证代理"""

import asyncio
import logging

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.interval import IntervalTrigger

from app.config import (
    FETCH_INTERVAL_MINUTES,
    FETCH_TIMEOUT_SECONDS,
    SCORING_TIMEOUT_SECONDS,
    VALIDATION_CYCLE_TIMEOUT_SECONDS,
)
from app.database import async_session, utcnow
from app.fetcher import cleanup_failed_proxies, sync_proxies
from app.routers.events import broadcast
from app.scorer import update_all_scores
from app.validator import validate_all

logger = logging.getLogger(__name__)

scheduler = AsyncIOScheduler()
_is_running = False


async def run_validation_cycle():
    """执行一次完整的获取+验证周期（带整体超时兜底，防止卡死）"""
    global _is_running
    if _is_running:
        logger.warning("上一轮验证尚未完成，跳过本次")
        return

    _is_running = True
    try:
        await asyncio.wait_for(_run_cycle(), timeout=VALIDATION_CYCLE_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        logger.error("验证周期整体超时（%s 秒），已强制中止本轮，下一轮将正常执行", VALIDATION_CYCLE_TIMEOUT_SECONDS)
        await broadcast({"type": "progress", "data": {"status": "error", "message": "验证周期超时，已中止本轮"}})
    except Exception as e:
        logger.exception(f"验证周期出错: {e}")
        await broadcast({"type": "progress", "data": {"status": "error", "message": f"出错: {str(e)}"}})
    finally:
        _is_running = False


async def _run_cycle():
    """实际执行周期（可被外层 wait_for 整体取消）"""
    # 阶段 1: 获取
    await broadcast({"type": "progress", "data": {"status": "fetching", "message": "正在获取代理列表..."}})
    try:
        async with async_session() as db:
            fetch_stats = await asyncio.wait_for(sync_proxies(db), timeout=FETCH_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        logger.error("获取代理阶段超时（%s 秒），本轮终止", FETCH_TIMEOUT_SECONDS)
        await broadcast({"type": "progress", "data": {"status": "error", "message": "获取代理超时，本轮终止"}})
        return
    await broadcast(
        {
            "type": "progress",
            "data": {
                "status": "fetching_done",
                "message": f"获取完成: 新增 {fetch_stats['added']}, 更新 {fetch_stats['updated']}",
            },
        }
    )

    # 阶段 2: 验证
    await broadcast({"type": "progress", "data": {"status": "validating", "message": "开始验证代理..."}})

    async def progress_cb(validated, total, success):
        logger.info("验证进度: %d/%d (成功: %d)", validated, total, success)
        await broadcast(
            {
                "type": "progress",
                "data": {
                    "status": "validating",
                    "total": total,
                    "validated": validated,
                    "success": success,
                    "message": f"验证进度: {validated}/{total} (成功: {success})",
                },
            }
        )

    val_stats = await validate_all(progress_callback=progress_cb)

    # 阶段 3: 更新评分
    await broadcast({"type": "progress", "data": {"status": "scoring", "message": "更新评分..."}})
    try:
        async with async_session() as db:
            await asyncio.wait_for(update_all_scores(db), timeout=SCORING_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        logger.error("评分阶段超时，跳过")

    # 阶段 4: 清理失效代理
    try:
        async with async_session() as db:
            cleaned = await asyncio.wait_for(cleanup_failed_proxies(db), timeout=SCORING_TIMEOUT_SECONDS)
    except asyncio.TimeoutError:
        logger.error("清理阶段超时，跳过")
        cleaned = 0

    # 完成
    msg = f"验证完成! 共 {val_stats['validated']} 个, 成功 {val_stats['success']} 个, 清理 {cleaned} 个失效代理"
    await broadcast(
        {
            "type": "progress",
            "data": {
                "status": "done",
                "message": msg,
                "timestamp": utcnow().isoformat(),
            },
        }
    )
    logger.info(f"验证周期完成: {val_stats}, 清理: {cleaned}")


def start_scheduler():
    """启动定时调度器"""
    scheduler.add_job(
        run_validation_cycle,
        trigger=IntervalTrigger(minutes=FETCH_INTERVAL_MINUTES),
        id="validation_cycle",
        replace_existing=True,
        max_instances=1,
        coalesce=True,
        misfire_grace_time=60,
        next_run_time=utcnow(),  # 立即执行一次
    )
    scheduler.start()
    logger.info(f"调度器已启动，每 {FETCH_INTERVAL_MINUTES} 分钟执行一次")


def stop_scheduler():
    """停止调度器"""
    if scheduler.running:
        scheduler.shutdown(wait=False)
        logger.info("调度器已停止")
