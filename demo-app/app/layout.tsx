import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Aurora Analytics · Adaptive Dashboard",
  description:
    "Enterprise data analytics dashboard demonstrating the Dynamic UI Morphing framework's Normal, Focus, Exploration, and Clarity modes.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
