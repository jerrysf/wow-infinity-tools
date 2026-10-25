import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { localizedPath } from "@/lib/site";
import { getBuilds, getGuideBySlug, getGuides } from "@/lib/data";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ProvenanceBlock } from "@/components/site/ProvenanceBlock";
import { BuildDemoBanner } from "@/components/builds/BuildsCatalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => getGuides().map((g) => ({ locale, slug: g.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/guides/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const guide = getGuideBySlug(slug);
  if (!guide) return {};
  return pageMetadata({
    locale,
    path: `/guides/${slug}`,
    title: pick(guide.title, locale),
    description: pick(guide.description, locale),
  });
}

export default async function GuidePage({ params }: PageProps<"/[locale]/guides/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const guide = getGuideBySlug(slug);
  if (!guide) notFound();
  const dict = getDictionary(locale);
  const builds = getBuilds().filter((b) => guide.relatedBuilds.includes(b.slug));
  const isDemo = guide.provenance.status === "unverified";

  return (
    <article>
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { href: "/guides", label: dict.guides.title },
          { label: pick(guide.title, locale) },
        ]}
      />
      <h1 className="text-2xl font-bold">{pick(guide.title, locale)}</h1>
      <p className="mt-1 mb-4 text-sm text-zinc-500">
        {dict.common.updated}: {guide.updatedAt} · {dict.common.version}: {guide.provenance.gameVersion}
      </p>
      {isDemo && <BuildDemoBanner demo dict={dict} />}
      {guide.sections.map((section, i) => (
        <section key={i} className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">{pick(section.heading, locale)}</h2>
          <p className="leading-relaxed text-zinc-700 dark:text-zinc-300">{pick(section.body, locale)}</p>
        </section>
      ))}
      {builds.length > 0 && (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">{dict.guides.relatedBuilds}</h2>
          <ul className="list-inside list-disc text-sm">
            {builds.map((b) => (
              <li key={b.slug}>
                <Link
                  href={localizedPath(locale, `/builds/${b.slug}`)}
                  className="text-blue-700 underline dark:text-blue-400"
                >
                  {pick(b.name, locale)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <ProvenanceBlock provenance={guide.provenance} dict={dict} />
    </article>
  );
}
