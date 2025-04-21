/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  reactStrictMode: true,
  eslint: {
    // Turn off eslint for production builds to avoid these errors
    ignoreDuringBuilds: true,
  },
  // Needed when using a custom server
  poweredByHeader: false,
};

module.exports = nextConfig; 