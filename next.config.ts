// next.config.ts
import type { NextConfig } from 'next';

/**
 * Next.js configuration
 *
 * • trailingSlash: true
 *   → Every route automatically gets a trailing slash.
 *   → Ensures “/supporter-chat” transparently redirects to “/supporter-chat/”,
 *     which is where the static HTML file will live (supporter-chat/index.html).
 */
const nextConfig: NextConfig = {
  trailingSlash: true,
};

export default nextConfig;
