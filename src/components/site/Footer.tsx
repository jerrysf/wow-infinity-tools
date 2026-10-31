import Link from "next/link";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import { localizedPath, site } from "@/lib/site";

export function Footer({ locale, dict }: { locale: Locale; dict: Dictionary }) {
  const links = [
    { href: "/faq", label: dict.common.footer.faq },
    { href: "/changelog", label: dict.common.footer.changelog },
    { href: "/about", label: dict.common.footer.about },
    { href: "/contact", label: dict.common.footer.contact },
    { href: "/privacy", label: dict.common.footer.privacy },
    { href: "/disclaimer", label: dict.common.footer.disclaimer },
    { href: "/disclosure", label: dict.common.footer.disclosure },
  ];
  return (
    <footer className="mt-16 border-t border-[#2a2012]">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <nav className="flex flex-wrap gap-x-6 gap-y-2" aria-label="Footer">
          {links.map((link) => (
            <Link
              key={link.href}
              href={localizedPath(locale, link.href)}
              className="text-sm text-[#8a7a58] hover:text-amber-200"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="mt-4 max-w-3xl text-xs leading-relaxed text-[#95865c]">
          {dict.common.footer.independent}
        </p>
        <p className="mt-2 text-xs text-[#92825c]">
          {site.name}
        </p>
      </div>
    </footer>
  );
}
