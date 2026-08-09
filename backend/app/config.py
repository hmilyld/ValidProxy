"""配置常量"""

# 代理数据源 URL
PROXY_SOURCE_URL = "https://cdn.jsdelivr.net/gh/proxifly/free-proxy-list@main/proxies/all/data.json"

# 数据库
DATABASE_URL = "sqlite+aiosqlite:///./validproxy.db"

# 验证设置
VALIDATION_CONCURRENCY = 100
VALIDATION_TIMEOUT = 5  # 单个验证超时(秒)
VALIDATION_URLS = [
    "https://ifconfig.io/all.json",
    "https://api.ipify.org/",
    "https://ipecho.net/plain",
    "http://ipinfo.io/ip",
    "http://ip-api.com/json",
]

# 调度
FETCH_INTERVAL_MINUTES = 15

# 清理策略
MAX_CONSECUTIVE_FAILURES = 3  # 连续失败 N 次后自动删除

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
