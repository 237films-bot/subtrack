import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Removed 'output: export' to support Supabase authentication
  // Static export is incompatible with server-side auth features
  trailingSlash: true,
};

export default nextConfig;
