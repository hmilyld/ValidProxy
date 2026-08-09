import type { NextConfig } from "next";

// 后端代理目标地址。
// 开发与单镜像生产都默认在同机 127.0.0.1:18001（前端服务端代发请求，浏览器不直接连后端）。
// 用 127.0.0.1 而非 localhost，避免 localhost 优先解析到 IPv6 (::1) 导致代理连接失败。
// 注意：next.config.ts 在 build 阶段求值，Docker 镜像内的默认值即正确值，一般无需覆盖。
const backendUrl = process.env.BACKEND_URL ?? "http://127.0.0.1:18001";

// 开发模式下允许访问 dev server 的来源（Tailscale 内网 IP / 局域网 IP）。
// 可通过环境变量 ALLOWED_DEV_ORIGINS 逗号分隔覆盖，例如：
//   ALLOWED_DEV_ORIGINS="100.x.x.x,my-server" pnpm dev
const allowedDevOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? "100.89.143.7,172.27.94.155")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const nextConfig: NextConfig = {
  output: "standalone",
  // 关闭 gzip 压缩：默认压缩会把 SSE (/api/events) 响应缓冲在服务端，
  // 浏览器的 EventSource 永远收不到事件，导致"连接事件服务…/链接中…"卡住。
  compress: false,
  allowedDevOrigins,
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${backendUrl}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
