import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        brand: {
          DEFAULT: "#5b5bf6",
          soft: "#eef0ff",
          deep: "#3f3fd9",
        },
        ink: {
          DEFAULT: "#0b1020",
          900: "#0f1529",
          800: "#161d36",
          700: "#222a47",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(15, 23, 42, 0.04), 0 4px 16px -6px rgba(15, 23, 42, 0.08)",
        "card-hover": "0 2px 4px rgba(15, 23, 42, 0.05), 0 16px 32px -12px rgba(15, 23, 42, 0.18)",
        glow: "0 0 0 1px rgba(91, 91, 246, 0.15), 0 8px 30px -8px rgba(91, 91, 246, 0.45)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(4px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-ring": {
          "0%, 100%": { boxShadow: "0 0 0 0 rgba(16, 185, 129, 0.25)" },
          "50%": { boxShadow: "0 0 0 8px rgba(16, 185, 129, 0.04)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "equalize": {
          "0%, 100%": { transform: "scaleY(0.35)" },
          "50%": { transform: "scaleY(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.25s ease-out both",
        "pulse-ring": "pulse-ring 2.4s ease-in-out infinite",
        shimmer: "shimmer 2.2s linear infinite",
        equalize: "equalize 0.9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
