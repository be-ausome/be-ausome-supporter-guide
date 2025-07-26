// next.config.ts
import type { NextConfig } from 'next';

/**
 * Next.js configuration
 *
 * • reactStrictMode: true
 *     – Helpful warning layer during development/build.
 * • experimental.appDir: true
 *     – Explicitly enables the “src/app” (App Router) directory.
 * • trailingSlash: false
 *     – Default behaviour; you can flip to `true` if you need
 *       `/foo/` URLs, but leaving it `false` avoids static-export quirks.
 *
 * NOTE:  ⚠️  Do **NOT** add `output: "export"` (or run `next export`)
 *        if you want API routes to work.  That option removes all server
 *        code—including files in `src/app/api/**/route.ts`.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  trailingSlash: false,
};

export default nextConfig;
