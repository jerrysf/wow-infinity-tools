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
    <html lang="zh-CN">
      <body>
        <main style={{ padding: "4rem 1rem", textAlign: "center", fontFamily: "sans-serif" }}>
          <h1>404 - Page Not Found / 页面不存在</h1>
          <p>
            <Link href="/zh-cn">返回首页</Link> · <Link href="/en-us">Back to home</Link>
          </p>
        </main>
      </body>
    </html>
  );
}
