/** @type {import('next').NextConfig} */
const nextConfig = {
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
