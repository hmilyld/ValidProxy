"""SQLAlchemy ORM 模型"""

from sqlalchemy import Boolean, Column, DateTime, Float, Integer, String, func
from sqlalchemy.orm import DeclarativeBase


class Base(DeclarativeBase):
    pass


class Proxy(Base):
    __tablename__ = "proxies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    proxy = Column(String, unique=True, nullable=False, index=True)
    protocol = Column(String, nullable=False)
    ip = Column(String, nullable=False)
    port = Column(Integer, nullable=False)
    country = Column(String, default="Unknown")
    city = Column(String, default="Unknown")
    anonymity = Column(String, default="transparent")
    https = Column(Boolean, default=False)

    # 评分和验证相关
    score = Column(Float, default=0.0)
    response_time_ms = Column(Float, default=0.0)
    success_rate = Column(Float, default=0.0)
    total_checks = Column(Integer, default=0)
    success_checks = Column(Integer, default=0)
    consecutive_successes = Column(Integer, default=0)

    # 时间戳
    last_checked_at = Column(DateTime, nullable=True)
    last_success_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=func.now())
    updated_at = Column(DateTime, default=func.now(), onupdate=func.now())
