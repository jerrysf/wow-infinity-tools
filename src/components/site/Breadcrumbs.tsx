import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/lib/site";

export interface Crumb {
  href?: string;
  label: string;
}

export function Breadcrumbs({ locale, items }: { locale: Locale; items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-zinc-500 dark:text-zinc-400">
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link
                href={localizedPath(locale, item.href)}
                className="hover:text-zinc-900 hover:underline dark:hover:text-zinc-100"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-zinc-700 dark:text-zinc-300">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
