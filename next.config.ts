import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  typescript: {
    ignoreBuildErrors: true,
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
      {
        source: '/ADMIN',
        destination: '/admin',
        permanent: true,
      },
    ];
  },
};

export default withPWA(nextConfig);
