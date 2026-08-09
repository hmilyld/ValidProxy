"""代理地址解析、规范化与 SSRF 防护"""

import ipaddress
import logging
import socket
from urllib.parse import urlparse

logger = logging.getLogger(__name__)

# httpx 实际支持的代理协议
VALID_SCHEMES = {"http", "https", "socks5", "socks5h"}
_UNSUPPORTED_HINT = {
    "socks4": "不支持 socks4 代理测试",
}


def normalize_proxy_url(raw: str) -> str:
    """规范化代理地址，无协议前缀时自动补 http://，返回 httpx 可用的 URL"""
    addr = raw.strip()
    if not addr:
        raise ValueError("代理地址不能为空")
    if "://" not in addr:
        addr = f"http://{addr}"
    scheme = addr.split("://", 1)[0].lower()
    if scheme in _UNSUPPORTED_HINT:
        raise ValueError(_UNSUPPORTED_HINT[scheme])
    if scheme not in VALID_SCHEMES:
        raise ValueError(f"不支持的代理协议: {scheme}")
    return addr


def _is_public_ip(ip: ipaddress._BaseAddress) -> bool:
    return not (
        ip.is_private or ip.is_loopback or ip.is_link_local or ip.is_reserved or ip.is_multicast or ip.is_unspecified
    )


def assert_public_host(proxy_url: str) -> None:
    """SSRF 防护：代理 host 必须能解析到公网地址，否则抛 ValueError"""
    parsed = urlparse(proxy_url)
    host = parsed.hostname
    if not host:
        raise ValueError("无法解析代理地址中的主机名")

    try:
        infos = socket.getaddrinfo(host, None, proto=socket.IPPROTO_TCP)
    except socket.gaierror:
        raise ValueError(f"无法解析代理主机名: {host}")

    resolved = []
    for info in infos:
        try:
            resolved.append(ipaddress.ip_address(info[4][0]))
        except ValueError:
            continue
    if not resolved:
        raise ValueError(f"无法解析代理主机名: {host}")

    blocked = sorted({str(ip) for ip in resolved if not _is_public_ip(ip)})
    if blocked:
        raise ValueError(f"代理目标不允许指向内网/保留地址: {', '.join(blocked)}")
