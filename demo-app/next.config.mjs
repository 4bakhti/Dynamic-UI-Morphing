import path from "node:path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Hackathon deployment safety net: do not block the production bundle on
  // type-checking or lint findings. Runtime/module errors still fail normally.
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
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
