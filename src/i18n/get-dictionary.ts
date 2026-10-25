import type { Locale } from "./config";
import type { Dictionary } from "./dictionaries/zh-cn";
import zh from "./dictionaries/zh-cn";
import en from "./dictionaries/en-us";

const dictionaries: Record<Locale, Dictionary> = {
  "zh-cn": zh,
  "en-us": en,
};

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale] ?? zh;
}

/** Simple "{key}" interpolation for dictionary templates. */
export function t(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in vars ? String(vars[key]) : `{${key}}`,
  );
}

/** Pick the localized string for a locale, falling back to the default language. */
export function pick(
  localized: { zh: string; en: string } | undefined,
  locale: Locale,
): string {
  if (!localized) return "";
  return (locale === "en-us" ? localized.en : localized.zh) || localized.zh || localized.en;
}
