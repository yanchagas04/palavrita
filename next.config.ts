import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Origin",
            value: "*",
          },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'self' https://*.discord.com https://*.discord.net https://*.discordsays.com;",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
