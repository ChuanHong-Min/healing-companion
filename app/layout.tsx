import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "治愈伙伴 - 你的专属AI陪伴",
  description: "一个治愈系、情感陪伴型AI智能体，懂你、陪你、治愈你",
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  themeColor: "#5B9BD5",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <body className={`${inter.className} antialiased`}>
        {children}
      </body>
    </html>
  );
}
