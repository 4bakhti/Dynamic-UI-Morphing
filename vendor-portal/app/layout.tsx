import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Developing Agent · Vendor Portal",
  description:
    "Onboard your application into the Adaptive UI framework. Generate cognitive-state layout configurations from your component structure.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="bg-grid min-h-screen">{children}</body>
    </html>
  );
}
