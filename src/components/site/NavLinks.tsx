"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/lib/site";

export function NavLinks({
  locale,
  items,
}: {
  locale: Locale;
  items: { href: string; label: string }[];
}) {
  const pathname = usePathname();
  return (
    <>
      {items.map((item) => {
        const href = localizedPath(locale, item.href);
        const active = pathname === href || pathname.startsWith(`${href}/`);
        return (
          <Link
            key={item.href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`shrink-0 whitespace-nowrap rounded-md px-2.5 py-1.5 text-sm font-medium transition-colors ${
              active
                ? "bg-[#1c2940] text-[#f0bc4a]"
                : "text-slate-300 hover:bg-[#16202e] hover:text-slate-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
