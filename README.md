# ValidProxy - 代理验证工具

实时验证代理可用性，提供综合评分（0-100），支持自动定时获取、验证与失效清理，并提供 Web 界面实时监控。

## 功能特性

- **定时获取**：每小时自动从远程数据源同步最新代理列表
- **批量验证**：100 并发异步验证代理可用性，内置验证 URL 故障切换
- **综合评分**：基于响应时间、历史成功率、匿名等级、协议类型、历史稳定性加权计算
- **失效清理**：连续失败达到阈值（默认 3 次）的代理自动删除
- **实时推送**：SSE 实时推送获取/验证/评分进度
- **Web 界面**：Next.js + shadcn/ui，支持筛选、排序、分页、深色模式、响应式布局

## 技术栈

| 端 | 技术 |
|---|---|
| 后端 | Python 3.13 · FastAPI · SQLAlchemy 2 (async) · httpx · APScheduler · SQLite |
| 前端 | Next.js 16 · React 19 · TypeScript · Tailwind CSS v4 · shadcn/ui · SWR · Recharts |
| 部署 | 单容器 Docker（前端 standalone 代理后端 `/api`）· GitHub Actions 自动构建镜像 |

## 评分算法（0-100）

| 维度 | 权重 | 计算方式 |
|---|---|---|
| 响应时间 | 30% | <500ms=满分, 500-2000ms 线性衰减, >2000ms=0 |
| 历史成功率 | 25% | success_checks / total_checks |
| 匿名等级 | 20% | elite=100, transparent=30 |
| 协议类型 | 15% | https/http=100, socks5=70, socks4=50 |
| 历史稳定性 | 10% | 连续成功次数越多分越高 |

## 快速开始

### 方式一：Docker（推荐）

```bash
docker compose up -d --build
```

访问 <http://localhost:5173>。数据库（`backend/data/validproxy.db`）通过 Docker 卷持久化。

### 方式二：本地开发

后端（依赖管理使用 [uv](https://docs.astral.sh/uv/)）：

```bash
cd backend
uv venv
uv pip install -r requirements.txt
uv run python run.py        # http://localhost:18001，自动 reload
```

前端：

```bash
cd frontend
pnpm install
pnpm dev                    # http://localhost:5173
```

开发时前端服务端将 `/api` 请求代理到 `http://127.0.0.1:18001`（后端）。

## 环境变量

| 变量 | 默认值 | 说明 |
|---|---|---|
| `BACKEND_URL` | `http://127.0.0.1:18001` | 前端服务端代理后端 API 的地址（`next.config.ts` 构建时求值） |
| `ALLOWED_DEV_ORIGINS` | 见 `next.config.ts` | 开发模式下允许访问 dev server 的来源（逗号分隔） |
| `PORT` / `HOSTNAME` | `5173` / `0.0.0.0` | 容器内前端 standalone 服务监听地址 |

## API 接口

- `GET /api/proxies` - 分页获取代理列表（默认仅返回有效代理，即 score>0；支持 protocol/country/anonymity/min_score/search 筛选与排序，`include_invalid=true` 可包含无效代理）
- `GET /api/proxies/stats` - 统计概览（总数、可用数、平均分、协议分布、国家 Top10）
- `GET /api/proxies/{id}` - 单个代理详情
- `GET /api/events` - SSE 实时事件流（获取/验证/评分进度）
- `GET /api/health` - 健康检查

## 项目结构

```
ValidProxy/
├── Dockerfile               # 单镜像构建（前端 standalone + 后端）
├── docker-compose.yml       # 容器编排，数据卷持久化 SQLite
├── docker-entrypoint.sh     # 容器启动脚本（先起后端，再起前端）
├── backend/                 # Python FastAPI 后端
│   ├── app/
│   │   ├── main.py          # 应用入口（生命周期、CORS、路由注册）
│   │   ├── config.py        # 配置常量（数据源、并发、阈值、权重）
│   │   ├── database.py      # 异步引擎与会话
│   │   ├── models.py        # ORM 模型
│   │   ├── schemas.py       # Pydantic 响应模型
│   │   ├── fetcher.py       # 远程代理同步与失效清理
│   │   ├── validator.py     # 并发验证与结果落库
│   │   ├── scorer.py        # 综合评分
│   │   ├── scheduler.py     # 定时调度（每小时一轮）
│   │   └── routers/         # API 路由（proxies / events）
│   ├── pyproject.toml       # 项目元数据 + ruff 配置
│   ├── requirements.txt     # 运行时依赖（Docker 安装源）
│   └── run.py               # 本地启动脚本（reload）
└── frontend/                # Next.js + shadcn/ui 前端
    ├── src/
    │   ├── app/             # 页面（layout / page）
    │   ├── components/      # 业务组件与 ui 基础组件
    │   ├── hooks/           # 数据获取（SWR）与筛选状态
    │   └── lib/             # API 封装与格式化工具
    └── next.config.ts       # standalone 输出、/api 代理、关闭 gzip（兼容 SSE）
```

## 代码质量

- 后端：`cd backend && uv run ruff check . && uv run ruff format .`
- 前端：`cd frontend && pnpm lint && pnpm tsc --noEmit`
- CI（`.github/workflows/ci.yml`）：PR/推送时自动执行 lint、类型检查、ESLint，main 分支构建并推送 GHCR 镜像。
