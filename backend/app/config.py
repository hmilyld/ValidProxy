"""配置常量"""

# 代理数据源 URL
PROXY_SOURCE_URL = "https://cdn.jsdelivr.net/gh/proxifly/free-proxy-list@main/proxies/all/data.json"

# 数据库（data 目录由 database.py 自动创建，Docker 卷挂载持久化）
DATABASE_URL = "sqlite+aiosqlite:///./data/validproxy.db"

# 验证设置
VALIDATION_CONCURRENCY = 100
VALIDATION_TIMEOUT = 5  # 单个验证超时(秒)
VALIDATION_URLS = [
    "https://github.com/",
    "https://www.githubstatus.com/",
]

# 调度
FETCH_INTERVAL_MINUTES = 60

# 各阶段超时（秒），防止某个 await 永久挂起而卡死调度器
FETCH_TIMEOUT_SECONDS = 300  # 获取+同步入库阶段上限
SCORING_TIMEOUT_SECONDS = 300  # 评分/清理阶段上限
VALIDATION_CYCLE_TIMEOUT_SECONDS = 7200  # 整周期兜底上限（2 小时），超过强制中止本轮

# 清理策略
MAX_CONSECUTIVE_FAILURES = 3  # 连续失败 N 次后自动删除

# 单次代理测试（POST /api/proxies/test）
PROXY_TEST_CONCURRENCY = 10  # 全局并发上限
PROXY_TEST_RATE_LIMIT = 30  # 每 IP 每分钟最多测试次数

# 评分权重
SCORE_WEIGHTS = {
    "response_time": 0.30,
    "success_rate": 0.25,
    "anonymity": 0.20,
    "protocol": 0.15,
    "stability": 0.10,
}

# 协议分数映射
PROTOCOL_SCORES = {
    "https": 100,
    "http": 100,
    "socks5": 70,
    "socks4": 50,
}

# 匿名等级分数映射
ANONYMITY_SCORES = {
    "elite": 100,
    "transparent": 30,
}

# 服务
HOST = "0.0.0.0"
PORT = 18001
