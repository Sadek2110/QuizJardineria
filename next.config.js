/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    // Linting runs in CI; do not block production Docker builds on lint.
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig;
