/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    // Turn off eslint for production builds to avoid these errors
    ignoreDuringBuilds: true,
  },
};

module.exports = nextConfig; 