import Link from "next/link";
import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { localizedPath } from "@/lib/site";
import { getGuides } from "@/lib/data";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { StatusBadge } from "@/components/site/StatusBadge";

export async function generateMetadata({ params }: PageProps<"/[locale]/guides">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/guides", title: dict.guides.title, description: dict.guides.description });
}

export default async function GuidesPage({ params }: PageProps<"/[locale]/guides">) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale);
  const guides = getGuides();

  return (
    <div>
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { label: dict.guides.title },
        ]}
      />
      <h1 className="mb-2 text-2xl font-bold">{dict.guides.title}</h1>
      <p className="mb-6 max-w-2xl text-zinc-600 dark:text-zinc-400">{dict.guides.description}</p>
      {guides.length === 0 && <p className="text-zinc-500">{dict.guides.empty}</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link
              href={localizedPath(locale, `/guides/${g.slug}`)}
              className="block rounded-lg border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
            >
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-base font-semibold">{pick(g.title, locale)}</h2>
                <StatusBadge status={g.provenance.status} dict={dict} />
              </div>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{pick(g.description, locale)}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {dict.common.version}: {g.provenance.gameVersion} · {dict.common.updated}: {g.updatedAt}
              </p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
