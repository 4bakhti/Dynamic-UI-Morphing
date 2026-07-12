// Basic default-src 'self' CSP as an XSS backstop. Next's App Router injects
// inline hydration scripts and the code panel renders inline-styled tokens, so
// scripts/styles need 'unsafe-inline'; dev additionally needs 'unsafe-eval' for
// React Refresh. The LLM routes are same-origin (connect-src 'self'); the
// browser never talks to OpenAI directly — the server proxies every call.
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
