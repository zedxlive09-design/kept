import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // §3 — Static export for Capacitor compatibility.
  // The same out/ directory deployed to Vercel becomes the webDir for an Android APK later.
  output: "export",

  // §3 — next/image optimizer is a server feature; it can't run in a static/Capacitor context.
  images: {
    unoptimized: true,
  },

  typescript: {
    ignoreBuildErrors: false,
  },

  reactStrictMode: false,
};

export default nextConfig;