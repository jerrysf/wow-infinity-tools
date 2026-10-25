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
            className={`rounded px-2 py-1 ${
              active
                ? "bg-zinc-800 font-semibold text-white dark:bg-zinc-200 dark:text-zinc-900"
                : "text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            }`}
          >
            {localeNames[locale]}
          </Link>
        );
      })}
    </div>
  );
}
