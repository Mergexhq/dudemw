import type { NextConfig } from "next";

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

  // Remove turbo config as it's not supported in this Next.js version
};

export default nextConfig;
