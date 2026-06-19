import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        brand: {
          DEFAULT: "#4f46e5",
          soft: "#eef2ff",
        },
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(79, 70, 229, 0.25)" },
          "50%": { boxShadow: "0 0 0 8px rgba(79, 70, 229, 0.05)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out both",
        "pulse-ring": "pulse-ring 2s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
