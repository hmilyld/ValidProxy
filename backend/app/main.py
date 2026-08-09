"""FastAPI 应用入口"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.exc import OperationalError

from app.database import engine
from app.models import Base
from app.routers import events, proxies
from app.scheduler import start_scheduler, stop_scheduler

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """应用生命周期：启动时建表并启动调度器"""
    logger.info("正在初始化数据库...")
    try:
        async with engine.begin() as conn:
            # 使用 WAL 模式，支持验证阶段的高并发读写
            await conn.execute(text("PRAGMA journal_mode=WAL"))
            # 写权限自检：尽早暴露"只读数据库"问题
            await conn.execute(text("CREATE TABLE IF NOT EXISTS _writable_check (id INTEGER)"))
            await conn.execute(text("DELETE FROM _writable_check"))
            await conn.run_sync(Base.metadata.create_all)
    except OperationalError as e:
        logger.error("数据库不可写（%s）。请检查数据目录/卷权限，确保 SQLite 文件所在目录可写。", e)
        raise
    logger.info("数据库初始化完成")

    start_scheduler()
    logger.info("应用启动完成")

    yield

    stop_scheduler()
    await engine.dispose()
    logger.info("应用已关闭")


app = FastAPI(
    title="ValidProxy",
    description="代理验证工具 API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS - 允许前端访问
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(proxies.router)
app.include_router(events.router)


@app.get("/api/health")
async def health():
    return {"status": "ok"}
