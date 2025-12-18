import type { NextConfig } from "next";

// Bundle analyzer configuration
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const nextConfig: NextConfig = {
  serverExternalPackages: ['@supabase/supabase-js'],
  
  // Disable source maps in development to avoid warnings
  productionBrowserSourceMaps: false,
  
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },

  // Turbopack configuration (empty config to acknowledge Turbopack awareness)
  turbopack: {},
  
  // Webpack optimizations for bundle size (used when running with --webpack flag)
  webpack: (config, { isServer }) => {
    // Reduce bundle size by tree-shaking
    if (!isServer) {
      config.optimization.usedExports = true;
    }
    return config;
  },
};

export default withBundleAnalyzer(nextConfig);
