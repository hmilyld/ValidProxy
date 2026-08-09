"""代理列表 API 路由"""

import math
from datetime import datetime
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models import Proxy
from app.schemas import PaginatedResponse, ProxyResponse, ProxyStats

router = APIRouter(prefix="/api/proxies", tags=["proxies"])


@router.get("", response_model=PaginatedResponse)
async def list_proxies(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    protocol: Optional[str] = None,
    country: Optional[str] = None,
    anonymity: Optional[str] = None,
    min_score: Optional[float] = Query(None, ge=0, le=100),
    sort_by: str = Query("score", pattern="^(score|response_time_ms|success_rate|last_checked_at|country)$"),
    sort_order: str = Query("desc", pattern="^(asc|desc)$"),
    search: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """分页获取代理列表"""
    query = select(Proxy)

    # 筛选
    if protocol:
        query = query.where(Proxy.protocol == protocol)
    if country:
        query = query.where(Proxy.country == country)
    if anonymity:
        query = query.where(Proxy.anonymity == anonymity)
    if min_score is not None:
        query = query.where(Proxy.score >= min_score)
    if search:
        query = query.where(
            Proxy.ip.contains(search) | Proxy.proxy.contains(search)
        )

    # 统计总数
    count_query = select(func.count()).select_from(query.subquery())
    total = (await db.execute(count_query)).scalar() or 0

    # 排序
    sort_column = getattr(Proxy, sort_by)
    if sort_order == "desc":
        query = query.order_by(sort_column.desc())
    else:
        query = query.order_by(sort_column.asc())

    # 分页
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size)

    result = await db.execute(query)
    proxies = result.scalars().all()

    return PaginatedResponse(
        items=[ProxyResponse.model_validate(p) for p in proxies],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


@router.get("/stats", response_model=ProxyStats)
async def get_stats(db: AsyncSession = Depends(get_db)):
    """获取统计概览"""
    # 总数
    total = (await db.execute(select(func.count(Proxy.id)))).scalar() or 0

    # 可用数 (score > 0)
    active = (
        await db.execute(select(func.count(Proxy.id)).where(Proxy.score > 0))
    ).scalar() or 0

    # 平均分
    avg_score = (await db.execute(select(func.avg(Proxy.score)))).scalar() or 0

    # 协议分布
    protocol_dist_result = await db.execute(
        select(Proxy.protocol, func.count(Proxy.id)).group_by(Proxy.protocol)
    )
    protocol_distribution = {row[0]: row[1] for row in protocol_dist_result.all()}

    # 国家 Top 10
    country_result = await db.execute(
        select(Proxy.country, func.count(Proxy.id))
        .group_by(Proxy.country)
        .order_by(func.count(Proxy.id).desc())
        .limit(10)
    )
    country_top10 = [{"country": row[0], "count": row[1]} for row in country_result.all()]

    # 最后验证时间
    last_validation = (
        await db.execute(
            select(func.max(Proxy.last_checked_at))
        )
    ).scalar()

    return ProxyStats(
        total=total,
        active=active,
        avg_score=round(avg_score, 1),
        last_validation_at=last_validation,
        protocol_distribution=protocol_distribution,
        country_top10=country_top10,
    )


@router.get("/{proxy_id}", response_model=ProxyResponse)
async def get_proxy(proxy_id: int, db: AsyncSession = Depends(get_db)):
    """获取单个代理详情"""
    proxy = await db.get(Proxy, proxy_id)
    if not proxy:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Proxy not found")
    return ProxyResponse.model_validate(proxy)
