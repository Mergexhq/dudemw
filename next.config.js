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
    INTERAKT_API_KEY: process.env.INTERAKT_API_KEY,
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
    // M-4: Build a strict Content Security Policy
    // Adjust trusted hosts to match deployed Razorpay/Clerk endpoints
    const csp = [
      `default-src 'self'`,
      // script-src: self + trusted third-parties (Razorpay, Clerk, GTM, GA4, Facebook Pixel)
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://js.stripe.com https://clerk.dudemw.com https://*.clerk.accounts.dev https://www.googletagmanager.com https://www.google-analytics.com https://connect.facebook.net https://va.vercel-scripts.com`,
      // worker-src: Clerk uses blob:-URL Web Workers — must be explicitly allowed
      `worker-src blob: 'self'`,
      `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.mathpix.com`,
      `font-src 'self' https://fonts.gstatic.com https://cdn.mathpix.com data:`,
      `img-src 'self' data: blob: https://res.cloudinary.com https://img.clerk.com https://ui-avatars.com https://checkout.razorpay.com https://www.google-analytics.com https://www.facebook.com https://www.googletagmanager.com`,
      // connect-src: API calls — Razorpay, Clerk, Resend, Upstash Redis, GTM, GA4, FB
      `connect-src 'self' https://api.razorpay.com https://lumberjack.razorpay.com https://clerk.dudemw.com https://*.clerk.accounts.dev https://*.clerk.com https://api.resend.com https://*.upstash.io wss: wss://*.upstash.io https://www.google-analytics.com https://analytics.google.com https://www.googletagmanager.com https://connect.facebook.net https://www.facebook.com`,
      `frame-src 'self' https://checkout.razorpay.com https://api.razorpay.com`,
      `object-src 'none'`,
      `base-uri 'self'`,
      `form-action 'self'`,
      `upgrade-insecure-requests`,
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          // HSTS: 1 year, include subdomains, preload-ready
          { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains; preload' },
          // CSP: locked down to known origins
          { key: 'Content-Security-Policy', value: csp },
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

