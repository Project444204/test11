import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  /* config options here */
  turbopack: {
    root: path.resolve(__dirname)
  },
  // Enable standalone output for Docker
  output: 'standalone'
};

export default nextConfig;
