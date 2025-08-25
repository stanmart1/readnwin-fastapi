/** @type {import('next').NextConfig} */
const path = require('path')

// Validate required environment variables
const requiredEnvVars = ['NEXT_PUBLIC_API_URL']
requiredEnvVars.forEach((envVar) => {
  if (!process.env[envVar]) {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
})

const nextConfig = {
  // Basic configuration
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',
  
  // Skip type checking during build
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  
  // Force standalone output and disable static optimization
  experimental: {
    outputFileTracingRoot: path.join(__dirname, '../../'),
  },
  
  // Disable static optimization completely
  generateStaticParams: false,
  trailingSlash: false,
  
  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        pathname: '/**',
      },
    ],
    unoptimized: false,
  },

  // Webpack configuration
  webpack: (config) => {
    // Path aliases
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname),
      '@/components': path.resolve(__dirname, 'components'),
      '@/lib': path.resolve(__dirname, 'lib'),
      '@/contexts': path.resolve(__dirname, 'contexts'),
      '@/stores': path.resolve(__dirname, 'stores'),
      '@/types': path.resolve(__dirname, 'types'),
    }

    return config
  },

  // Headers for security
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ]
  },

  // Performance optimizations
  poweredByHeader: false,
  compress: true,
}

module.exports = nextConfig