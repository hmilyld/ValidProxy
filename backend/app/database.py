"""数据库连接和会话管理"""

import os
from datetime import UTC, datetime

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.config import DATABASE_URL

# 确保 SQLite 数据目录存在（避免容器挂载卷时目录缺失）
db_dir = os.path.dirname(DATABASE_URL.removeprefix("sqlite+aiosqlite:///"))
if db_dir:
    os.makedirs(db_dir, exist_ok=True)

engine = create_async_engine(DATABASE_URL, echo=False)
async_session = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


def utcnow() -> datetime:
    """返回 naive UTC 时间（与 SQLite CURRENT_TIMESTAMP 语义一致）"""
    return datetime.now(UTC).replace(tzinfo=None)


async def get_db():
    """获取数据库会话（用于 FastAPI 依赖注入）"""
    async with async_session() as session:
        yield session
