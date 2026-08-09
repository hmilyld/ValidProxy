#!/bin/bash

# ValidProxy 开发管理脚本
# 用法: ./dev.sh [start|stop|status|logs|restart]

DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$DIR/backend"
FRONTEND_DIR="$DIR/frontend"

BACKEND_PORT=18001
FRONTEND_PORT=5173

PID_DIR="$DIR/.pids"
LOG_DIR="$DIR/.logs"
mkdir -p "$PID_DIR" "$LOG_DIR"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

is_running() {
    local pid_file="$PID_DIR/$1.pid"
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            return 0
        fi
        rm -f "$pid_file"
    fi
    return 1
}

wait_for_port() {
    local port=$1
    local name=$2
    local max=30
    local i=0
    while [ $i -lt $max ]; do
        if curl -s "http://localhost:$port" >/dev/null 2>&1; then
            return 0
        fi
        sleep 1
        i=$((i + 1))
    done
    return 1
}

start_backend() {
    if is_running backend; then
        echo -e "${YELLOW}后端已在运行 (PID: $(cat $PID_DIR/backend.pid))${NC}"
        return
    fi
    # 检查端口是否被占用，如果是则杀掉占用进程
    if fuser "$BACKEND_PORT/tcp" >/dev/null 2>&1; then
        echo -e "${YELLOW}端口 $BACKEND_PORT 被占用，正在释放...${NC}"
        fuser -k "$BACKEND_PORT/tcp" 2>/dev/null
        sleep 1
    fi
    echo -n -e "${CYAN}启动后端...${NC} "
    cd "$BACKEND_DIR"
    nohup uv run python run.py > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$PID_DIR/backend.pid"
    sleep 3
    if is_running backend; then
        echo -e "${GREEN}✓ 启动成功 (PID: $(cat $PID_DIR/backend.pid))${NC}"
        echo -e "  地址: http://localhost:$BACKEND_PORT"
    else
        echo -e "${RED}✗ 启动失败，查看日志: ./dev.sh logs backend${NC}"
    fi
}

start_frontend() {
    if is_running frontend; then
        echo -e "${YELLOW}前端已在运行 (PID: $(cat $PID_DIR/frontend.pid))${NC}"
        return
    fi
    # 检查端口是否被占用，如果是则杀掉占用进程
    if fuser "$FRONTEND_PORT/tcp" >/dev/null 2>&1; then
        echo -e "${YELLOW}端口 $FRONTEND_PORT 被占用，正在释放...${NC}"
        fuser -k "$FRONTEND_PORT/tcp" 2>/dev/null
        sleep 1
    fi
    echo -n -e "${CYAN}启动前端...${NC} "
    cd "$FRONTEND_DIR"
    nohup pnpm dev > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$PID_DIR/frontend.pid"
    sleep 5
    if is_running frontend; then
        echo -e "${GREEN}✓ 启动成功 (PID: $(cat $PID_DIR/frontend.pid))${NC}"
        echo -e "  地址: http://localhost:$FRONTEND_PORT"
    else
        echo -e "${RED}✗ 启动失败，查看日志: ./dev.sh logs frontend${NC}"
    fi
}

stop_process() {
    local name=$1
    local pid_file="$PID_DIR/$name.pid"
    if is_running "$name"; then
        local pid=$(cat "$pid_file")
        echo -n -e "${CYAN}停止 $name (PID: $pid)...${NC} "
        kill "$pid" 2>/dev/null
        # 等待进程退出，最多 5 秒
        local i=0
        while [ $i -lt 5 ] && kill -0 "$pid" 2>/dev/null; do
            sleep 1
            i=$((i + 1))
        done
        if kill -0 "$pid" 2>/dev/null; then
            kill -9 "$pid" 2>/dev/null
        fi
        rm -f "$pid_file"
        echo -e "${GREEN}✓ 已停止${NC}"
    else
        echo -e "${YELLOW}$name 未运行${NC}"
    fi
}

show_status() {
    echo -e "${CYAN}═══════════════════════════════════════${NC}"
    echo -e "${CYAN}  ValidProxy 服务状态${NC}"
    echo -e "${CYAN}═══════════════════════════════════════${NC}"

    # 后端状态
    if is_running backend; then
        local pid=$(cat "$PID_DIR/backend.pid")
        echo -e "  后端:   ${GREEN}● 运行中${NC}  PID: $pid  端口: $BACKEND_PORT"
        if curl -s "http://localhost:$BACKEND_PORT/api/health" >/dev/null 2>&1; then
            echo -e "          ${GREEN}✓ 健康检查通过${NC}"
        else
            echo -e "          ${YELLOW}⚠ 进程存在但无响应${NC}"
        fi
    else
        echo -e "  后端:   ${RED}○ 未运行${NC}  端口: $BACKEND_PORT"
    fi

    # 前端状态
    if is_running frontend; then
        local pid=$(cat "$PID_DIR/frontend.pid")
        echo -e "  前端:   ${GREEN}● 运行中${NC}  PID: $pid  端口: $FRONTEND_PORT"
    else
        echo -e "  前端:   ${RED}○ 未运行${NC}  端口: $FRONTEND_PORT"
    fi

    echo -e "${CYAN}═══════════════════════════════════════${NC}"
}

show_logs() {
    local target=${1:-all}
    case $target in
        backend|be)
            echo -e "${CYAN}--- 后端日志 (最近 50 行) ---${NC}"
            tail -50 "$LOG_DIR/backend.log" 2>/dev/null || echo "暂无日志"
            ;;
        frontend|fe)
            echo -e "${CYAN}--- 前端日志 (最近 50 行) ---${NC}"
            tail -50 "$LOG_DIR/frontend.log" 2>/dev/null || echo "暂无日志"
            ;;
        all)
            echo -e "${CYAN}--- 后端日志 (最近 30 行) ---${NC}"
            tail -30 "$LOG_DIR/backend.log" 2>/dev/null || echo "暂无日志"
            echo ""
            echo -e "${CYAN}--- 前端日志 (最近 30 行) ---${NC}"
            tail -30 "$LOG_DIR/frontend.log" 2>/dev/null || echo "暂无日志"
            ;;
        *)
            echo "用法: ./dev.sh logs [backend|frontend|all]"
            ;;
    esac
}

follow_logs() {
    local target=${1:-all}
    case $target in
        backend|be)
            tail -f "$LOG_DIR/backend.log" 2>/dev/null
            ;;
        frontend|fe)
            tail -f "$LOG_DIR/frontend.log" 2>/dev/null
            ;;
        all)
            tail -f "$LOG_DIR/backend.log" "$LOG_DIR/frontend.log" 2>/dev/null
            ;;
        *)
            echo "用法: ./dev.sh tail [backend|frontend|all]"
            ;;
    esac
}

usage() {
    echo -e "${CYAN}ValidProxy 开发管理脚本${NC}"
    echo ""
    echo "用法: ./dev.sh <命令>"
    echo ""
    echo "命令:"
    echo "  start       启动后端和前端"
    echo "  stop        停止后端和前端"
    echo "  restart     重启后端和前端"
    echo "  status      查看服务状态"
    echo "  logs        查看日志 (可选: backend|frontend|all)"
    echo "  tail        实时跟踪日志 (可选: backend|frontend|all)"
    echo ""
    echo "示例:"
    echo "  ./dev.sh start        # 启动所有服务"
    echo "  ./dev.sh stop         # 停止所有服务"
    echo "  ./dev.sh status       # 查看状态"
    echo "  ./dev.sh logs backend # 查看后端日志"
    echo "  ./dev.sh tail frontend # 实时跟踪前端日志"
}

case ${1:-help} in
    start)
        echo -e "${CYAN}═══ ValidProxy 启动 ═══${NC}"
        start_backend
        start_frontend
        echo ""
        show_status
        ;;
    stop)
        echo -e "${CYAN}═══ ValidProxy 停止 ═══${NC}"
        stop_process backend
        stop_process frontend
        ;;
    restart)
        echo -e "${CYAN}═══ ValidProxy 重启 ═══${NC}"
        stop_process backend
        stop_process frontend
        sleep 1
        start_backend
        start_frontend
        echo ""
        show_status
        ;;
    status)
        show_status
        ;;
    logs)
        show_logs "${2:-all}"
        ;;
    tail)
        follow_logs "${2:-all}"
        ;;
    *)
        usage
        ;;
esac
