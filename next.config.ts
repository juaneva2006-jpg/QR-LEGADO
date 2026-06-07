import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'export',
  basePath: '/legado',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lcolbdlzyhwjwotyhqwt.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
      {
        protocol: 'https',
        hostname: '**.unsplash.com',
      },
    ],
  },
  // Permitir accesos desde la IP de la red local
  // @ts-ignore
  allowedDevOrigins: ['192.168.1.135'],
  experimental: {
    serverActions: {
      allowedOrigins: ['192.168.1.135:3000'],
    },
  },
}

export default nextConfig
