import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  eslint: {
    // ⛔ Skip linting errors during build
    ignoreDuringBuilds: true,
  },
  typescript: {
    // ⛔ Skip type errors during build
    ignoreBuildErrors: true,
  },
  // ✅ Optional: ensure Next.js uses Node runtime (not Edge)
  experimental: {
    runtime: "nodejs",
  },
};

export default nextConfig;
