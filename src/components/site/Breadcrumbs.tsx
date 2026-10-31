import Link from "next/link";
import type { Locale } from "@/i18n/config";
import { absoluteUrl, localizedPath } from "@/lib/site";
import { JsonLd } from "@/components/site/JsonLd";

export interface Crumb {
  href?: string;
  label: string;
}

export function Breadcrumbs({ locale, items }: { locale: Locale; items: Crumb[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.label,
      ...(item.href ? { item: absoluteUrl(localizedPath(locale, item.href)) } : {}),
    })),
  };
  return (
    <nav aria-label="Breadcrumb" className="mb-4 text-sm text-[#7d8fa5]">
      <JsonLd data={jsonLd} />
      <ol className="flex flex-wrap items-center gap-1">
        {items.map((item, i) => (
          <li key={i} className="flex items-center gap-1">
            {i > 0 && <span aria-hidden="true">/</span>}
            {item.href ? (
              <Link
                href={localizedPath(locale, item.href)}
                className="hover:text-amber-200 hover:underline"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="text-[#b9c6d6]">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
