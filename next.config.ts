import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Logos are limited to 4 MB in the form; leave room for form overhead.
      // (Vercel caps request bodies at 4.5 MB.)
      bodySizeLimit: "4.4mb",
    },
  },
  // Only the /embed pages may be shown inside another site (the league website). Everything
  // else, especially admin and login, refuses to be framed, so it can't be disguised elsewhere.
  async headers() {
    const noFraming = [
      { key: "Content-Security-Policy", value: "frame-ancestors 'none'" },
      { key: "X-Frame-Options", value: "DENY" },
    ];
    return ["/", "/admin", "/admin/:path*", "/login", "/invoice/:path*", "/auth/:path*"].map((source) => ({
      source,
      headers: noFraming,
    }));
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
