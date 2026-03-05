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
  output: 'standalone',

  // Server-side environment variables (for Hostinger compatibility)
  env: {
    ADMIN_SETUP_KEY: process.env.ADMIN_SETUP_KEY,
    RAZORPAY_KEY_SECRET: process.env.RAZORPAY_KEY_SECRET,
    RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET,
    RESEND_API_KEY: process.env.RESEND_API_KEY,
  },

  // Strip all console.log in production (keep error/warn for monitoring)
  compiler: {
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'],
    } : false,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  productionBrowserSourceMaps: false,
  compress: true,
  poweredByHeader: false,

  images: {
    // Re-enable Next.js image optimization — serves WebP/AVIF (50-80% smaller than JPEG/PNG)
    // Hostinger limitation workaround: use Cloudinary's transformation API for resizing
    unoptimized: false,

    // Prefer AVIF (smallest), fallback to WebP
    formats: ['image/avif', 'image/webp'],

    // Tight device sizes — only what mobile actually needs
    deviceSizes: [390, 640, 750, 828, 1080, 1200],
    imageSizes: [16, 32, 64, 96, 128, 256],

    // Cache optimised images for 7 days
    minimumCacheTTL: 604800,

    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
      {
        protocol: 'https',
        hostname: 'img.clerk.com',
      },
      {
        protocol: 'https',
        hostname: 'ui-avatars.com',
      },
    ],
  },

  // Optimize package imports — tree-shake icon libraries & UI kits
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
      '@clerk/nextjs',
    ],
    serverActions: {
      bodySizeLimit: '5mb',
    },
  },

  turbopack: {},

  // Headers — performance + security
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
        ],
      },
      {
        // Cache all Next.js static chunks indefinitely (hash-busted automatically)
        source: '/_next/static/:staticPath*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        // Cache optimised images for 7 days
        source: '/_next/image/:imagePath*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=604800, stale-while-revalidate=86400' },
        ],
      },
      {
        // Cache static fonts indefinitely
        source: '/fonts/:fontPath*',
        headers: [
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },

  async redirects() {
    return [
      {
        source: '/account',
        destination: '/profile',
        permanent: true,
      },
    ]
  },

  // Webpack: granular chunk splitting for better mobile cache reuse
  webpack: (config, { isServer, dev }) => {
    if (!dev) {
      config.optimization.usedExports = true;
      config.optimization.minimize = true;

      if (!isServer) {
        config.optimization.splitChunks = {
          chunks: 'all',
          minSize: 20000,
          maxSize: 200000, // Cap chunks at 200 KB to avoid large payloads on mobile
          cacheGroups: {
            default: false,
            vendors: false,
            // React core — changes rarely, cache forever
            react: {
              name: 'react',
              chunks: 'all',
              test: /[\\/]node_modules[\\/](react|react-dom|scheduler)[\\/]/,
              priority: 40,
            },
            // Clerk auth bundle — large, isolate it
            clerk: {
              name: 'clerk',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]@clerk[\\/]/,
              priority: 35,
            },
            // Framer-motion — only needed on pages that animate
            framer: {
              name: 'framer',
              chunks: 'async', // Only load when async-imported
              test: /[\\/]node_modules[\\/]framer-motion[\\/]/,
              priority: 30,
            },
            // Radix UI — UI primitives
            radix: {
              name: 'radix',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]@radix-ui[\\/]/,
              priority: 25,
            },
            // All other node_modules
            vendor: {
              name: 'vendor',
              chunks: 'all',
              test: /[\\/]node_modules[\\/]/,
              priority: 20,
            },
            // App code shared across routes
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 10,
              reuseExistingChunk: true,
              enforce: true,
            },
          },
        };
      }
    }

    return config;
  },
};

module.exports = withBundleAnalyzer(nextConfig);
