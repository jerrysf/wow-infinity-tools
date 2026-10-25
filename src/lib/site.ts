import type { Locale } from "@/i18n/config";

/** Brand name is centralised so it can be renamed before launch. */
const baseUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://infinity-compendium.example.com"
).replace(/\/+$/, "");

export const site = {
  name: "Infinity Compendium",
  url: baseUrl,
  defaultOgImage: "/og-default.png",
};

export function localizedPath(locale: Locale, path: string): string {
  const clean = path === "/" ? "" : path.startsWith("/") ? path : `/${path}`;
  return `/${locale}${clean}`;
}

export function absoluteUrl(path: string): string {
  return `${site.url}${path}`;
}
