import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { InfoPage } from "@/components/site/InfoPage";

export async function generateMetadata({ params }: PageProps<"/[locale]/disclosure">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/disclosure", title: dict.pages.disclosure.title, description: dict.pages.disclosure.body[0] });
}

export default async function Page({ params }: PageProps<"/[locale]/disclosure">) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  return <InfoPage pageKey="disclosure" locale={locale} dict={getDictionary(locale)} />;
}
