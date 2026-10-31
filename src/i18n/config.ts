export const locales = ["zh-cn", "en-us"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "zh-cn";

/** BCP 47 language tags used for <html lang> and hreflang. */
export const localeLangTags: Record<Locale, string> = {
  "zh-cn": "zh-CN",
  "en-us": "en-US",
};

export function isLocale(value: string): value is Locale {
  return (locales as readonly string[]).includes(value);
}

/** Pick the best supported locale from an Accept-Language header value. */
export function detectLocale(acceptLanguage: string | null): Locale {
  if (!acceptLanguage) return defaultLocale;
  const candidates = acceptLanguage
    .split(",")
    .map((part) => part.trim().split(";")[0]?.toLowerCase() ?? "")
    .filter(Boolean);
  for (const tag of candidates) {
    if (tag.startsWith("zh")) return "zh-cn";
    if (tag.startsWith("en")) return "en-us";
  }
  return defaultLocale;
}

/** Strip a leading locale segment from a pathname, returning the rest. */
export function stripLocale(pathname: string): { locale: Locale | null; rest: string } {
  for (const locale of locales) {
    if (pathname === `/${locale}`) return { locale, rest: "/" };
    if (pathname.startsWith(`/${locale}/`)) {
      return { locale, rest: pathname.slice(locale.length + 1) };
    }
  }
  return { locale: null, rest: pathname };
}
