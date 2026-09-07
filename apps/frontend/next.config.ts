import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  output: 'export',
  transpilePackages: ['@erms/shared'],
  images: {
    unoptimized: true
  }
};

export default nextConfig;


