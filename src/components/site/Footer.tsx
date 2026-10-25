import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import { localizedPath, site } from "@/lib/site";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = [
    { href: "/about", label: dict.common.footer.about },
    { href: "/contact", label: dict.common.footer.contact },
    { href: "/privacy", label: dict.common.footer.privacy },
    { href: "/disclaimer", label: dict.common.footer.disclaimer },
    { href: "/disclosure", label: dict.common.footer.disclosure },
  ];
  return (
    <footer className="mt-16 border-t border-zinc-200 dark:border-zinc-800">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {links.map((link) => (
            <Link
              key={link.href}
              href={localizedPath(locale, link.href)}
              className="text-sm text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-zinc-500 dark:text-zinc-500">
          {dict.common.footer.independent}
        </p>
        <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-600">
          {site.name}
        </p>
      </div>
    </footer>
  );
}
