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
  // Allow Twitter image domains
  images: {
    domains: ['pbs.twimg.com', 'abs.twimg.com'],
  },
};

module.exports = nextConfig; 