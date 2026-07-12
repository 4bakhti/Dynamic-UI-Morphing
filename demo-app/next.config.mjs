import path from "node:path";

// Basic default-src 'self' CSP as an XSS backstop. Next's App Router injects
// inline hydration scripts and framer-motion writes inline style attributes, so
// scripts/styles need 'unsafe-inline'; dev additionally needs 'unsafe-eval' for
// React Refresh. All data the app talks to is same-origin (connect-src 'self').
const isDev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Types are clean and enforced in CI, so let a type error fail the build
  // rather than ship silently. Lint is still not a release blocker.
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "Content-Security-Policy", value: contentSecurityPolicy },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
        ],
      },
    ];
  },
  webpack: (config) => {
    // The dashboard imports the Behaviour Agent from ../src. On Vercel only
    // demo-app/node_modules is installed, so make that dependency location
    // explicit for modules whose issuer lives outside the app root.
    config.resolve.alias = {
      ...config.resolve.alias,
      zustand: path.resolve(process.cwd(), "node_modules/zustand"),
    };

    return config;
  },
};

export default nextConfig;
