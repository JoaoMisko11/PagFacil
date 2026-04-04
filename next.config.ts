import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      allowedOrigins: ["pagafacil.work", "www.pagafacil.work", "localhost:3005"],
    },
  },
};

export default nextConfig;
