import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "404 - Page Not Found",
  description: "The page you are looking for does not exist.",
  robots: { index: false },
};

export default function GlobalNotFound() {
  return (
    <html lang="zh-CN" className="dark">
      <body>
        <main className="flex min-h-screen flex-col items-center justify-center px-4 text-center">
          <p className="eyebrow">Infinity Compendium</p>
          <h1 className="mt-3 text-4xl font-extrabold tracking-tight text-white">
            404 - Page Not Found / 页面不存在
          </h1>
          <p className="mt-4 flex gap-4">
            <Link href="/zh-cn" className="btn-gold">
              返回首页
            </Link>
            <Link href="/en-us" className="btn-ghost">
              Back to home
            </Link>
          </p>
        </main>
      </body>
    </html>
  );
}
