import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  experimental: {
    staleTimes: {
      dynamic: 0,
      static: 30,
    },
  },
};

export default nextConfig;
