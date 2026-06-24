import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  cacheOnFrontEndNav: true,
  aggressiveFrontEndNavCaching: true,
  reloadOnOnline: true,
  swcMinify: true,
  workboxOptions: {
    disableDevLogs: true,
    ignoreURLParametersMatching: [/^utm_/, /^fbclid$/, /_rsc/],
  },
});

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "xeheuscrttrbfnojwwqt.supabase.co",
      }
    ],
  },
  async redirects() {
    return [

      {
        source: '/setting/admin',
        destination: '/admin/settings',
        permanent: true,
      },
    ];
  },
};

export default withPWA(nextConfig);
