/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker — includes only necessary files
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
        port: '3000',
        pathname: '/uploads/**',
      },
      {
        protocol: 'https',
        hostname: process.env.API_HOSTNAME ?? 'localhost',
        pathname: '/uploads/**',
      },
      {
        // Unsplash CDN — used for product image fallbacks
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
}

export default nextConfig
