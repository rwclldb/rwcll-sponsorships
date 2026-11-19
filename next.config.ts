import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Logos are limited to 4 MB in the form; leave room for form overhead.
      // (Vercel caps request bodies at 4.5 MB.)
      bodySizeLimit: "4.4mb",
    },
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
