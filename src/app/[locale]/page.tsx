import Link from "next/link";
import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { localizedPath } from "@/lib/site";
import { getBuilds, getClasses, getCurrentVersion, getGuides } from "@/lib/data";
import { StatusBadge, DemoBadge } from "@/components/site/StatusBadge";

export async function generateMetadata({ params }: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/", title: dict.home.title, description: dict.home.description });
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale);
  const classes = getClasses();
  const builds = getBuilds().slice(0, 4);
  const guides = getGuides().slice(0, 4);
  const version = getCurrentVersion();
  const classById = new Map(classes.map((c) => [c.id, c]));

  return (
    <div>
      <section className="py-8">
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight sm:text-4xl">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-zinc-600 dark:text-zinc-400">{dict.home.heroSubtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href={localizedPath(locale, "/tools/class-selector")}
            className="rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
          >
            {dict.home.ctaSelector}
          </Link>
          <Link
            href={localizedPath(locale, "/talents")}
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {dict.home.ctaTalents}
          </Link>
          <Link
            href={localizedPath(locale, "/builds")}
            className="rounded-lg border border-zinc-300 px-5 py-2.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {dict.home.ctaBuilds}
          </Link>
        </div>
        <p className="mt-4 text-xs text-zinc-500">
          {dict.common.version}: {version.label} · {dict.common.dataStatus}:{" "}
          {dict.common.status[classes[0]?.provenance.status ?? "unverified"]}
        </p>
      </section>

      <section className="mb-8 rounded-lg border border-purple-200 bg-purple-50 p-4 text-sm text-purple-900 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-200">
        <h2 className="mb-1 font-semibold">{dict.home.dataNotice}</h2>
        <p>{dict.home.dataNoticeBody}</p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">{dict.home.classesTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <li key={c.id}>
              <Link
                href={localizedPath(locale, `/talents/${c.slug}`)}
                className="block rounded-lg border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{pick(c.name, locale)}</span>
                  {c.demo && <DemoBadge dict={dict} />}
                </div>
                {c.tagline && (
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{pick(c.tagline, locale)}</p>
                )}
                {!c.hasTalentData && (
                  <p className="mt-1 text-xs text-zinc-500">{dict.talents.dataPending}</p>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">{dict.home.featuredBuilds}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {builds.map((b) => (
            <li key={b.slug}>
              <Link
                href={localizedPath(locale, `/builds/${b.slug}`)}
                className="block rounded-lg border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{pick(b.name, locale)}</span>
                  <StatusBadge status={b.provenance.status} dict={dict} />
                </div>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{pick(b.summary, locale)}</p>
                <p className="mt-2 text-xs text-zinc-500">
                  {classById.get(b.classId) ? pick(classById.get(b.classId)!.name, locale) : b.classId} ·{" "}
                  {b.playstyle} · {dict.common.version}: {b.gameVersion} · {dict.common.updated}: {b.updatedAt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">{dict.home.guidesTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link
                href={localizedPath(locale, `/guides/${g.slug}`)}
                className="block rounded-lg border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <span className="font-semibold">{pick(g.title, locale)}</span>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{pick(g.description, locale)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
