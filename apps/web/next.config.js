/** @type {import('next').NextConfig} */

// Bundle analyzer for build analysis (run with ANALYZE=true pnpm build)
const withBundleAnalyzer = process.env.ANALYZE === 'true'
  ? require('@next/bundle-analyzer')({ enabled: true })
  : (config) => config

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@rivest/ui', '@rivest/db', '@rivest/types'],

  experimental: {
    serverActions: {
      bodySizeLimit: '100mb',
    },
    // Optimize package imports for faster builds
    optimizePackageImports: [
      'lucide-react',
      '@tanstack/react-query',
      'date-fns',
      'recharts',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/pm',
      'exceljs',
      '@supabase/supabase-js',
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Production optimizations
  poweredByHeader: false,
  compress: true,

  // Generate build IDs for caching
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`
  },
}

module.exports = withBundleAnalyzer(nextConfig)
