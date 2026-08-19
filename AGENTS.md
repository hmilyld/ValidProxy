# AGENTS.md

## 项目结构

- `backend/` — Python 3.13 + FastAPI + SQLite（`backend/data/validproxy.db`，WAL），依赖用 **uv** 管理（有 `uv.lock`；`requirements.txt` 仅为 Docker 运行时依赖清单）。
- `frontend/` — Next.js 16 + React 19 + Tailwind v4 + shadcn/ui，包管理用 **pnpm**（`packageManager` 锁定 11.5.3）。
- 架构：前端服务端将 `/api/*` 代理到后端 18001；Docker 单容器部署时后端仅容器内可达，对外只暴露前端 5173。
- **不要用 pip/npm**：后端用 uv、前端用 pnpm。

## 常用命令

开发统一用 `./dev.sh start|stop|restart|status|logs|tail`（后端 18001 / 前端 5173，日志在 `.logs/`）。也可分别跑：

- 后端：`cd backend && uv run python run.py`（18001，自动 reload）
- 前端：`cd frontend && pnpm dev`（5173）

注意：启动后端会立即触发一轮「获取远程代理 + 100 并发验证 + 评分」周期（scheduler 启动即执行一次，之后每小时一轮），会有真实的外网请求。

## 关键实现约定（改动前先确认）

- `next.config.ts` 的 `compress: false` 是必须的：gzip 会在服务端缓冲 SSE（`/api/events`），导致 EventSource 收不到事件而卡住，不要去掉。
- `frontend/AGENTS.md` 是 `next dev` 自动生成的 Next.js 16 兼容性警告块，**不要删除**（删除后 dev 会重新生成）；写前端代码前先读 `node_modules/next/dist/docs/`。
- 后端常量集中在 `backend/app/config.py`（数据源、并发、清理阈值、评分权重、单测限流 30/min）。
- ruff 配置在 `backend/pyproject.toml`（line-length 120），但 ruff **不在 requirements.txt** 中；若 `.venv` 不存在，先 `uv venv && uv sync`（或 `uv pip install ruff`）才有 `.venv/bin/ruff`。
- 本仓库无测试套件，验证靠 CI（`.github/workflows/ci.yml`）与下面的本地检查。

## 提交前必做检查

每次 `git commit` / `git push` 之前，必须运行以下 format 与 lint 检查并确保全部通过：

### 后端 (workdir: `backend`)

```sh
.venv/bin/ruff check .
.venv/bin/ruff format --check .
```

若 `format --check` 失败，先运行 `.venv/bin/ruff format .` 修复后再提交。

### 前端 (workdir: `frontend`)

```sh
npx tsc --noEmit
npx eslint .
```

注意：本项目不使用 prettier，不要用 prettier 作为格式检查依据；前端格式门禁为 `tsc` + `eslint`。

## 推送确认

`git push` 必须经用户明确许可后方可执行，不得未经确认自行推送。
