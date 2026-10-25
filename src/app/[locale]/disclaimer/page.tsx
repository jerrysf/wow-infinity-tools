import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/site/InfoPage";

export async function generateMetadata({ params }: PageProps<"/[locale]/disclaimer">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/disclaimer", title: dict.pages.disclaimer.title, description: dict.pages.disclaimer.body[0] });
}

export default async function Page({ params }: PageProps<"/[locale]/disclaimer">) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  return <InfoPage pageKey="disclaimer" locale={locale} dict={getDictionary(locale)} />;
}
