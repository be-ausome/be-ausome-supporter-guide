/** @type {import('next').NextConfig} */
module.exports = {
  // ‼️ DELETE the old "experimental: { appDir: true }" line
  // experimental: { appDir: true },

  // Optional but handy: don’t fail the Vercel build on lint warnings
  eslint: { ignoreDuringBuilds: true }
};
