# ValidProxy - 代理验证工具

实时验证代理可用性，提供综合评分，支持自动定时更新。

## 功能特性

- **定时获取**: 每 15 分钟自动从远程获取最新代理列表
- **批量验证**: 50 并发异步验证代理可用性
- **综合评分**: 基于响应时间、成功率、匿名等级、协议类型、历史稳定性
- **实时推送**: SSE 实时推送验证进度
- **Web 界面**: shadcn/ui 美观界面，支持筛选、排序、分页

## 评分算法 (0-100)

| 维度 | 权重 | 计算方式 |
|---|---|---|
| 响应时间 | 30% | <500ms=满分, 500-2000ms 线性衰减, >2000ms=0 |
| 历史成功率 | 25% | success_checks / total_checks |
| 匿名等级 | 20% | elite=100, transparent=30 |
| 协议类型 | 15% | https/http=100, socks5=70, socks4=50 |
| 历史稳定性 | 10% | 连续成功次数越多分越高 |

## 快速开始

### 后端

```bash
cd backend
uv venv
uv pip install -r requirements.txt
uv run python run.py
```

后端启动在 http://localhost:18001

### 前端

```bash
cd frontend
pnpm install
pnpm dev
```

前端启动在 http://localhost:5173

## API 接口

- `GET /api/proxies` - 分页获取代理列表
- `GET /api/proxies/stats` - 获取统计概览
- `GET /api/events` - SSE 实时事件流
- `GET /api/health` - 健康检查

## 项目结构

```
ValidProxy/
├── backend/          # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py        # 应用入口
│   │   ├── config.py      # 配置
│   │   ├── database.py    # 数据库
│   │   ├── models.py      # ORM 模型
│   │   ├── schemas.py     # 响应模型
│   │   ├── fetcher.py     # 代理获取
│   │   ├── validator.py   # 代理验证
│   │   ├── scorer.py      # 评分算法
│   │   ├── scheduler.py   # 定时调度
│   │   └── routers/       # API 路由
│   └── run.py
└── frontend/         # Next.js + shadcn/ui 前端
    ├── src/
    │   ├── app/           # 页面
    │   ├── components/    # 组件
    │   ├── hooks/         # 数据获取
    │   └── lib/           # 工具函数
    └── package.json
```
