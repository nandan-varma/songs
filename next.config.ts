import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      { 
        protocol: 'https', 
        hostname: 'c.saavncdn.com',
        pathname: '/**',
      },
      { 
        protocol: 'https', 
        hostname: 'www.jiosaavn.com',
        pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
