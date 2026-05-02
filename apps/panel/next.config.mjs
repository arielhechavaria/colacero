/** @type {import('next').NextConfig} */
const nextConfig = {
  // Standalone output for Docker — includes only necessary files
  output: 'standalone',

  // Proxy /api/* → API service (evita CORS y bake de URLs en build time)
  // En prod: API_URL=http://api:3000 (red Docker interna)
  // En dev:  API_URL=http://localhost:3000 (default)
  async rewrites() {
    const apiUrl = process.env.API_URL ?? 'http://localhost:3000'
    return [
      {
        source:      '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ]
  },
}

export default nextConfig
