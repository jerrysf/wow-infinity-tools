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
    <header className="sticky top-0 z-40 border-b border-[#1c2635] bg-[#0a0e14]/95 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-2 gap-y-1 px-4 py-3">
        <Link
          href={localizedPath(locale, "/")}
          className="text-lg font-extrabold tracking-tight text-white"
        >
          <span className="text-[#f0bc4a]">∞</span> {site.name}
        </Link>
        <div className="order-2 sm:order-3">
          <Suspense fallback={null}>
            <LocaleSwitcher current={locale} dict={dict} />
          </Suspense>
        </div>
        <nav
          className="no-scrollbar order-3 -mx-4 flex w-full items-center gap-1 overflow-x-auto px-4 sm:order-2 sm:mx-0 sm:w-auto sm:gap-3 sm:overflow-visible sm:px-0"
          aria-label="Main"
        >
          <NavLinks locale={locale} items={navItems} />
        </nav>
      </div>
    </header>
  );
}
