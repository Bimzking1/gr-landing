import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Generate a fully static export so Netlify can serve it as plain files.
  // Remove this line if you later add API routes or server-side rendering.
  output: "export",

  // next/image optimisation requires a running Node server; disable it for
  // static exports so the build doesn't fail on Netlify.
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
