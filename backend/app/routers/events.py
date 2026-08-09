"""SSE 事件推送路由"""

import asyncio
import json
from typing import AsyncGenerator

from fastapi import APIRouter
from sse_starlette.sse import EventSourceResponse

router = APIRouter(tags=["events"])

# 全局事件队列（每个连接一个队列）
_subscribers: list[asyncio.Queue] = []


async def broadcast(event: dict):
    """向所有订阅者广播事件"""
    dead = []
    for q in _subscribers:
        try:
            q.put_nowait(event)
        except asyncio.QueueFull:
            dead.append(q)
    for q in dead:
        _subscribers.remove(q)


async def _event_generator(queue: AsyncGenerator) -> AsyncGenerator:
    """生成 SSE 事件流"""
    try:
        while True:
            event = await queue.get()
            yield {
                "event": event.get("type", "message"),
                "data": json.dumps(event.get("data", {})),
            }
    except asyncio.CancelledError:
        pass


@router.get("/api/events")
async def sse_events():
    """SSE 端点 - 实时推送验证进度"""
    queue: asyncio.Queue = asyncio.Queue(maxsize=100)
    _subscribers.append(queue)

    async def generate():
        try:
            # 发送初始连接成功消息
            yield {
                "event": "connected",
                "data": json.dumps({"message": "Connected to SSE"}),
            }
            while True:
                event = await queue.get()
                yield {
                    "event": event.get("type", "message"),
                    "data": json.dumps(event.get("data", {})),
                }
        except asyncio.CancelledError:
            pass
        finally:
            if queue in _subscribers:
                _subscribers.remove(queue)

    return EventSourceResponse(generate())
