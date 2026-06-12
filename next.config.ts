import withPWAInit from "@ducanh2912/next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
});

/** @type {import('next').NextConfig} */
const nextConfig = {
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
    ];
  },
};

export default withPWA(nextConfig);
