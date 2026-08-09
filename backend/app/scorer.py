"""综合评分模块"""

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import SCORE_WEIGHTS, PROTOCOL_SCORES, ANONYMITY_SCORES
from app.models import Proxy


def calculate_score(proxy: Proxy) -> float:
    """计算单个代理的综合评分 (0-100)"""

    # 1. 响应时间评分 (30%): <500ms=满分, 500-2000ms 线性衰减, >2000ms=0
    if proxy.response_time_ms <= 0:
        rt_score = 0
    elif proxy.response_time_ms < 500:
        rt_score = 100
    elif proxy.response_time_ms < 2000:
        rt_score = max(0, 100 - (proxy.response_time_ms - 500) / 15)
    else:
        rt_score = 0

    # 2. 历史成功率评分 (25%)
    sr_score = proxy.success_rate * 100

    # 3. 匿名等级评分 (20%)
    an_score = ANONYMITY_SCORES.get(proxy.anonymity, 30)

    # 4. 协议类型评分 (15%)
    pr_score = PROTOCOL_SCORES.get(proxy.protocol, 50)

    # 5. 历史稳定性评分 (10%): 连续成功次数越多分越高
    if proxy.consecutive_successes >= 20:
        st_score = 100
    elif proxy.consecutive_successes >= 10:
        st_score = 70 + (proxy.consecutive_successes - 10) * 3
    elif proxy.consecutive_successes >= 5:
        st_score = 40 + (proxy.consecutive_successes - 5) * 6
    elif proxy.consecutive_successes >= 1:
        st_score = proxy.consecutive_successes * 8
    else:
        st_score = 0

    # 加权求和
    score = (
        rt_score * SCORE_WEIGHTS["response_time"]
        + sr_score * SCORE_WEIGHTS["success_rate"]
        + an_score * SCORE_WEIGHTS["anonymity"]
        + pr_score * SCORE_WEIGHTS["protocol"]
        + st_score * SCORE_WEIGHTS["stability"]
    )

    return round(min(100, max(0, score)), 1)


async def update_all_scores(db: AsyncSession) -> int:
    """更新所有代理的评分，返回更新数量"""
    result = await db.execute(select(Proxy))
    proxies = result.scalars().all()
    count = 0
    for proxy in proxies:
        new_score = calculate_score(proxy)
        if proxy.score != new_score:
            proxy.score = new_score
            count += 1
    await db.commit()
    return count
