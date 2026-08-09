# AGENTS.md

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
