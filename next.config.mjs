/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      path: false,
      crypto: false,
      child_process: false,
      'node-fetch': false,
      canvas: false,
      net: false,
      tls: false,
    };
    return config;
  },
};

export default nextConfig;
