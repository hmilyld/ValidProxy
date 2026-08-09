import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  allowedDevOrigins: ["100.89.143.7", "172.27.94.155"],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:18001/api/:path*",
      },
    ];
  },
};

export default nextConfig;
