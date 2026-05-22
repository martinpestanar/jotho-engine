import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow external connections for local mobile testing
  // @ts-expect-error Next.js 16 feature
  allowedDevOrigins: ["192.168.1.145"],
};

export default nextConfig;
