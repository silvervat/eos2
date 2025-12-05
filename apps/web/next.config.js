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
      '@tanstack/react-table',
      'date-fns',
      'recharts',
      '@tiptap/react',
      '@tiptap/starter-kit',
      '@tiptap/pm',
      'exceljs',
    ],
  },

  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
    ],
    // Optimize image formats
    formats: ['image/avif', 'image/webp'],
    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    // Image sizes for optimized loading
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
  },

  // Compiler optimizations
  compiler: {
    // Remove console.log in production
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // Webpack optimizations
  webpack: (config, { isServer }) => {
    // Optimize chunks
    if (!isServer) {
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            // Vendor chunks
            vendor: {
              name: 'vendor',
              test: /[\\/]node_modules[\\/]/,
              priority: 10,
              chunks: 'initial',
              reuseExistingChunk: true,
            },
            // React and React DOM
            react: {
              name: 'react',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 20,
              chunks: 'all',
            },
            // Tanstack libs (react-query, react-table, react-virtual)
            tanstack: {
              name: 'tanstack',
              test: /[\\/]node_modules[\\/]@tanstack[\\/]/,
              priority: 15,
              chunks: 'all',
            },
            // Lucide icons
            icons: {
              name: 'icons',
              test: /[\\/]node_modules[\\/]lucide-react[\\/]/,
              priority: 15,
              chunks: 'all',
            },
            // Date utilities
            dateUtils: {
              name: 'date-utils',
              test: /[\\/]node_modules[\\/]date-fns[\\/]/,
              priority: 15,
              chunks: 'all',
            },
            // Charting libs
            charts: {
              name: 'charts',
              test: /[\\/]node_modules[\\/](recharts|d3-[\w-]+)[\\/]/,
              priority: 15,
              chunks: 'async',
            },
            // Document processing (heavy, load async)
            documents: {
              name: 'documents',
              test: /[\\/]node_modules[\\/](mammoth|exceljs|pdf-parse|jszip|@pdfme[\\/][\w-]+)[\\/]/,
              priority: 15,
              chunks: 'async',
            },
            // Rich text editor
            tiptap: {
              name: 'tiptap',
              test: /[\\/]node_modules[\\/](@tiptap[\\/][\w-]+|prosemirror-[\w-]+)[\\/]/,
              priority: 15,
              chunks: 'async',
            },
          },
        },
      }
    }

    return config
  },

  // Production optimizations
  poweredByHeader: false,

  // Compression handled by Vercel/server
  compress: true,

  // Generate build IDs for caching
  generateBuildId: async () => {
    return process.env.VERCEL_GIT_COMMIT_SHA || `build-${Date.now()}`
  },
}

module.exports = withBundleAnalyzer(nextConfig)
