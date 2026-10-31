"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { locales, localeNames, stripLocale, type Locale } from "@/i18n/config";

/** Switches locale while preserving the current path and query string. */
export function LocaleSwitcher({ current }: { current: Locale }) {
  const pathname = usePathname() ?? "/";
  const searchParams = useSearchParams();
  const { rest } = stripLocale(pathname);
  const query = searchParams.toString();

  return (
    <div className="flex items-center gap-1 text-sm" aria-label="Language">
      {locales.map((locale) => {
        const href = `/${locale}${rest === "/" ? "" : rest}${query ? `?${query}` : ""}`;
        const active = locale === current;
        return (
          <Link
            key={locale}
            href={href}
            aria-current={active ? "true" : undefined}
            className={`rounded-md px-2 py-1 text-xs font-semibold transition-colors ${
              active
                ? "bg-[#f0bc4a] text-[#1a1204]"
                : "text-slate-300 hover:text-slate-100"
            }`}
          >
            {localeNames[locale]}
          </Link>
        );
      })}
    </div>
  );
}
