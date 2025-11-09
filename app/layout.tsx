import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Life Management",
  description: "AI-powered life management and self-improvement platform",
  manifest: "/manifest.json",
  themeColor: "#000000",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "LifeAI",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
