/** @type {import('next').NextConfig} */
const nextConfig = {
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
  webpack: (config, { dev }) => {
    // On Windows the project can be reached via a path whose letter-casing
    // differs from disk (e.g. DYNAMIC-UI-MORPHING vs Dynamic-UI-Morphing).
    // webpack's persistent file cache mis-resolves chunks in that case, which
    // corrupts the dev bundle and throws a client-side exception in the browser.
    // Using an in-memory cache in dev sidesteps the problem entirely.
    if (dev) {
      config.cache = { type: "memory" };
    }
    return config;
  },
};

export default nextConfig;
