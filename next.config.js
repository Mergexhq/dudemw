/** @type {import('next').NextConfig} */

// Bundle analyzer configuration (only load if available)
let withBundleAnalyzer = (config) => config;
try {
  withBundleAnalyzer = require('@next/bundle-analyzer')({
    enabled: process.env.ANALYZE === 'true',
  });
} catch (e) {
  // Bundle analyzer not available in production, skip it
}

const nextConfig = {
  // Hostinger Cloud Starter Optimizations (Nginx-based)

  // Enable standalone output for optimal deployment on Hostinger Cloud
  // This creates a minimal production server with all dependencies bundled
  output: 'standalone',

  // Server-side environment variables (for Hostinger compatibility)
  // These are explicitly passed to the server runtime
  env: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ADMIN_SETUP_KEY: process.env.ADMIN_SETUP_KEY,
  },

  // Compiler optimizations
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  // External packages for server components
  serverExternalPackages: ['@supabase/supabase-js'],

  // Re-enable TypeScript checking to catch errors during build
  typescript: {
    ignoreBuildErrors: false,
  },

  // Enable source maps only in development
  productionBrowserSourceMaps: false,

  // Enable compression for better performance
  compress: true,

  // Power-saving mode for Hostinger shared resources
  poweredByHeader: false,

  images: {
    // Disable optimization to bypass private IP restriction on Hostinger
    unoptimized: true,

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Optimized cache time for production
    minimumCacheTTL: 3600, // 1 hour

    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'qyvpihdiyuowkyideltd.supabase.co',
      },
    ],
  },

  // Optimize package imports to reduce bundle size
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'framer-motion',
      '@radix-ui/react-dialog',
      '@radix-ui/react-dropdown-menu',
      '@radix-ui/react-select',
      '@radix-ui/react-popover',
      '@radix-ui/react-tabs',
      '@radix-ui/react-accordion',
      'recharts',
    ],
  },

  // Turbopack configuration (empty to acknowledge migration from webpack)
  turbopack: {},

  // Headers for security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
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
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        // Cache static assets aggressively
        source: '/_next/static/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/account',
        destination: '/profile',
        permanent: true,
      },
    ]
  },

  // Webpack optimizations for production builds
  webpack: (config, { isServer, dev }) => {
    // Production optimizations
    if (!dev) {
      // Tree shaking
      config.optimization.usedExports = true;

      // Minimize bundle size
      config.optimization.minimize = true;

      // Split chunks for better caching
      if (!isServer) {
        config.optimization.splitChunks = {
          chunks: 'all',
          cacheGroups: {
            default: false,
            vendors: false,
            // Vendor chunk
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /node_modules/,
              priority: 20
            },
            // Common chunk
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true
            }
          }
        };
      }
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
