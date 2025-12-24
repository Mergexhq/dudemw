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
  // Removed standalone output - causes issues on Hostinger shared hosting
  // Use standard Next.js deployment instead

  serverExternalPackages: ['@supabase/supabase-js'],

  // Re-enable TypeScript checking to catch errors during build
  typescript: {
    ignoreBuildErrors: false,
  },

  // Disable source maps in development to avoid warnings
  productionBrowserSourceMaps: false,

  // Enable compression
  compress: true,

  images: {
    // Disable optimization to bypass private IP restriction
    unoptimized: true,

    // Device sizes for responsive images
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],

    // Reduced cache time for testing
    minimumCacheTTL: 60,

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
    ],
  },

  // Turbopack configuration (empty config to acknowledge Turbopack awareness)
  turbopack: {},

  // Headers for admin subdomain security
  async headers() {
    return [
      {
        // Security headers for admin subdomain
        source: '/:path*',
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
            value: 'strict-origin-when-cross-origin',
          },
        ],
        // Only apply to admin subdomain (checked in middleware)
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
      // Block direct /admin access on main domain (middleware will handle subdomain)
      // Note: This is a fallback; middleware handles the primary routing
    ]
  },

  // Webpack optimizations for bundle size (used when running with --webpack flag)
  webpack: (config, { isServer }) => {
    // Reduce bundle size by tree-shaking
    if (!isServer) {
      config.optimization.usedExports = true;
    }
    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
