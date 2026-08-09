"""FastAPI 应用入口"""

import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine
from app.models import Base
from app.routers import proxies, events
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
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
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
