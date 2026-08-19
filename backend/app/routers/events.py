"""SSE 事件推送路由"""

import asyncio
import json

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


@router.get("/api/debug/tasks")
async def debug_tasks():
    """调试接口：列出当前所有 asyncio 任务的调用栈，用于定位卡死点"""
    rows = []
    for t in asyncio.all_tasks():
        stack = []
        for frame in t.get_stack(limit=20):
            stack.append(f"{frame.f_code.co_filename}:{frame.f_lineno} {frame.f_code.co_name}")
        coro = str(t.get_coro())
        rows.append(
            {
                "name": t.get_name(),
                "done": t.done(),
                "cancelled": t.cancelled(),
                "coro": coro[:200] if coro else None,
                "stack": stack,
            }
        )
    return {"count": len(rows), "tasks": rows}


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
