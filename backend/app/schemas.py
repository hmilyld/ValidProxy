"""Pydantic 响应模型"""

from datetime import datetime
from typing import Optional
from pydantic import BaseModel


class ProxyResponse(BaseModel):
    id: int
    proxy: str
    protocol: str
    ip: str
    port: int
    country: str
    city: str
    anonymity: str
    https: bool
    score: float
    response_time_ms: float
    success_rate: float
    total_checks: int
    success_checks: int
    last_checked_at: Optional[datetime] = None
    last_success_at: Optional[datetime] = None
    created_at: datetime

    model_config = {"from_attributes": True}


class ProxyStats(BaseModel):
    total: int
    active: int  # score > 0 的
    avg_score: float
    last_fetch_at: Optional[datetime] = None
    last_validation_at: Optional[datetime] = None
    protocol_distribution: dict[str, int]
    country_top10: list[dict]


class PaginatedResponse(BaseModel):
    items: list[ProxyResponse]
    total: int
    page: int
    page_size: int
    total_pages: int


class ValidationProgress(BaseModel):
    status: str  # "idle" | "fetching" | "validating" | "done"
    total: int = 0
    validated: int = 0
    success: int = 0
    message: str = ""
