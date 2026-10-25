import type { Metadata } from "next";
import { locales, localeLangTags, defaultLocale, type Locale } from "@/i18n/config";
import { absoluteUrl, localizedPath, site } from "@/lib/site";

const ogLocale: Record<Locale, string> = {
  "zh-cn": "zh_CN",
  "en-us": "en_US",
};

interface PageMeta {
  locale: Locale;
  /** Path without the locale prefix, e.g. "/tools/class-selector". */
  path: string;
  title: string;
  description: string;
  /** Set false for thin/duplicate pages that should not be indexed. */
  index?: boolean;
}

export function pageMetadata({ locale, path, title, description, index = true }: PageMeta): Metadata {
  const canonical = localizedPath(locale, path);
  const languages: Record<string, string> = {};
  for (const l of locales) {
    languages[localeLangTags[l]] = localizedPath(l, path);
  }
  languages["x-default"] = localizedPath(defaultLocale, path);

  return {
    title,
    description,
    robots: index ? undefined : { index: false, follow: false },
    alternates: {
      canonical,
      languages,
    },
    openGraph: {
      title,
      description,
      url: absoluteUrl(canonical),
      siteName: site.name,
      locale: ogLocale[locale],
      alternateLocale: locales.filter((l) => l !== locale).map((l) => ogLocale[l]),
      type: "website",
    },
  };
}
