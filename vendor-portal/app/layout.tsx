import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Code Refactoring Engine · Vendor Portal",
  description:
    "Onboard your application into the Adaptive UI framework. The Developing Agent refactors your React components to morph across cognitive states.",
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
