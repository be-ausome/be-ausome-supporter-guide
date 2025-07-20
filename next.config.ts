// next.config.ts
import type { NextConfig } from 'next';

/**
 * Next.js configuration
 *
 * - trailingSlash: true
 *     ◦ Every route automatically gets a trailing slash.
 *     ◦ Ensures `/supporter-chat` redirects (308) → `/supporter-chat/`,
 *       matching the static `index.html` that Next exports in that folder.
 */
const nextConfig: NextConfig = {
  trailingSlash: true,
};

export default nextConfig;
