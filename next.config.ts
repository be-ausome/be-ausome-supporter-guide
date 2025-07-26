
@'
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: { appDir: true },  // keeps src/app/… working
  trailingSlash: false
};

export default nextConfig;
