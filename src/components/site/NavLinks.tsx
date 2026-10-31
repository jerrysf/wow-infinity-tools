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
            className={`rounded px-2 py-1 text-sm ${
              active
                ? "bg-[#211809] font-medium text-amber-300"
                : "text-zinc-400 hover:bg-[#211809] hover:text-amber-200"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}
