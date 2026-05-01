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
    ],
  },
}

export default nextConfig
