import { Suspense } from "react";
import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import { localizedPath } from "@/lib/site";
import { LocaleSwitcher } from "./LocaleSwitcher";
import { NavLinks } from "./NavLinks";
import { site } from "@/lib/site";

export function Header({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const navItems = [
    { href: "/tools/class-selector", label: dict.common.nav.classSelector },
    { href: "/talents", label: dict.common.nav.talents },
    { href: "/builds", label: dict.common.nav.builds },
    { href: "/guides", label: dict.common.nav.guides },
    { href: "/faq", label: dict.common.nav.faq },
  ];
  return (
    <header className="sticky top-0 z-40 border-b border-[#2a2012] bg-[#100b06]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2 px-4 py-3">
        <Link
          href={localizedPath(locale, "/")}
          className="text-lg font-bold tracking-wide text-amber-300"
        >
          {site.name}
        </Link>
        <nav className="flex flex-wrap items-center gap-1 sm:gap-3" aria-label="Main">
          <NavLinks locale={locale} items={navItems} />
          <Suspense fallback={null}>
            <LocaleSwitcher current={locale} />
          </Suspense>
        </nav>
      </div>
    </header>
  );
}
