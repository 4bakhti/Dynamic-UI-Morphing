import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-sans", display: "swap" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono", display: "swap" });

export const metadata: Metadata = {
  title: "Aurora Analytics · Adaptive Dashboard",
  description:
    "Enterprise analytics dashboard that morphs between Normal, Focus, Exploration, and Clarity modes from privacy-first behaviour telemetry — with a Gemini copilot, ElevenLabs voice, and a Solana transparency ledger.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
