import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI辩论平台",
  description: "让AI以不同角色参与辩论，探索思维碰撞的火花",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <header className="border-b border-gray-200">
          <nav className="max-w-6xl mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center space-x-1">
              <Link href="/" className="font-bold text-lg text-blue-600">
                AI辩论平台
              </Link>
            </div>
            <div className="flex space-x-4">
              <Link href="/" className="text-gray-600 hover:text-blue-600">
                首页
              </Link>
              <Link href="/notebooks" className="text-gray-600 hover:text-blue-600">
                笔记本管理
              </Link>
            </div>
          </nav>
        </header>
        <main className="min-h-screen">
          {children}
        </main>
        <footer className="py-4 border-t border-gray-200">
          <div className="max-w-6xl mx-auto px-4 text-center text-sm text-gray-500">
            <p>© {new Date().getFullYear()} AI辩论平台 - 笔记本持久化版</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
