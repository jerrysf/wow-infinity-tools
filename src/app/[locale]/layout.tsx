import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/next";
import { Geist, Geist_Mono } from "next/font/google";
import { locales, isLocale, localeLangTags, type Locale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { site } from "@/lib/site";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import "../globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.name, template: `%s - ${site.name}` },
  verification: {
    google: "62EMnCnGeg0513YYSKuTH85CH-kiT8z2AEKBT0--iyE",
    ...(process.env.BAIDU_SITE_VERIFICATION
      ? { other: { "baidu-site-verification": process.env.BAIDU_SITE_VERIFICATION } }
      : {}),
  },
};

export default async function LocaleLayout({
  children,
  params,
}: LayoutProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  const dict = getDictionary(locale);

  return (
    <html lang={localeLangTags[locale as Locale]} className={`dark ${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        {process.env.NEXT_PUBLIC_ADS_ENABLED === "true" && process.env.NEXT_PUBLIC_ADSENSE_CLIENT && (
          <Script
            async
            strategy="afterInteractive"
            src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_ADSENSE_CLIENT}`}
            crossOrigin="anonymous"
          />
        )}
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-2 focus:z-50 focus:rounded focus:bg-[#f0bc4a] focus:px-3 focus:py-1.5 focus:text-sm focus:font-semibold focus:text-[#0a0e14]"
        >
          {dict.common.skipToContent}
        </a>
        <Header locale={locale} dict={dict} />
        <main id="main" className="mx-auto w-full max-w-5xl flex-1 px-4 py-6">{children}</main>
        <Footer locale={locale} dict={dict} />
        {process.env.VERCEL === "1" && <Analytics />}
      </body>
    </html>
  );
}
