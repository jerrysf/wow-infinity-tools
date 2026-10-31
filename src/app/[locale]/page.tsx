import Link from "next/link";
import type { Metadata } from "next";
import { isLocale, localeLangTags } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl, localizedPath, site } from "@/lib/site";
import { JsonLd } from "@/components/site/JsonLd";
import { getBuilds, getClasses, getCurrentVersion, getGuides } from "@/lib/data";
import { StatusBadge, DemoBadge } from "@/components/site/StatusBadge";
import { classColor } from "@/lib/class-colors";
import { AdSlot } from "@/components/site/AdSlot";

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

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: site.name,
      url: site.url,
      inLanguage: ["zh-CN", "en-US"],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: site.name,
      url: absoluteUrl(localizedPath(locale, "/")),
      description: dict.home.description,
      applicationCategory: "GameApplication",
      operatingSystem: "Any",
      inLanguage: localeLangTags[locale],
      offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
    },
  ];

  return (
    <div>
      <JsonLd data={jsonLd} />
      <section
        className="relative my-2 overflow-hidden rounded-xl border border-[#3a2b14] p-7 sm:p-10"
        style={{
          background:
            "radial-gradient(ellipse at 15% 0%, #2b2418 0%, #17110a 55%, #0f0b06 100%)",
        }}
      >
        <h1 className="max-w-2xl text-3xl font-bold tracking-tight text-[#f4e9d0] sm:text-4xl">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-[#b0a284]">{dict.home.heroSubtitle}</p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href={localizedPath(locale, "/tools/class-selector")} className="btn-gold">
            {dict.home.ctaSelector}
          </Link>
          <Link href={localizedPath(locale, "/talents")} className="btn-ghost">
            {dict.home.ctaTalents}
          </Link>
          <Link href={localizedPath(locale, "/builds")} className="btn-ghost">
            {dict.home.ctaBuilds}
          </Link>
        </div>
        <p className="mt-5 text-xs text-[#7a6a4a]">
          {dict.common.version}: {version.label} · {dict.common.dataStatus}:{" "}
          {dict.common.status[classes[0]?.provenance.status ?? "unverified"]}
        </p>
      </section>

      <section className="card mb-8 p-4 text-sm text-[#b0a284]">
        <h2 className="mb-1 font-semibold text-[#e8dfd0]">{dict.home.dataNotice}</h2>
        <p>{dict.home.dataNoticeBody}</p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 text-xl font-semibold">{dict.home.classesTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <li key={c.id}>
              <Link
                href={localizedPath(locale, `/talents/${c.slug}`)}
                className="card card-interactive block p-4"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold" style={{ color: classColor(c.id) }}>
                    {pick(c.name, locale)}
                  </span>
                  {c.demo && <DemoBadge dict={dict} />}
                </div>
                {c.tagline && (
                  <p className="mt-1 text-sm text-[#b0a284]">{pick(c.tagline, locale)}</p>
                )}
                {!c.hasTalentData && (
                  <p className="mt-1 text-xs text-[#7a6a4a]">{dict.talents.dataPending}</p>
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
                className="card card-interactive block p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold">{pick(b.name, locale)}</span>
                  <StatusBadge status={b.provenance.status} dict={dict} />
                </div>
                <p className="mt-1 text-sm text-[#b0a284]">{pick(b.summary, locale)}</p>
                <p className="mt-2 text-xs text-[#7a6a4a]">
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
                className="card card-interactive block p-4"
              >
                <span className="font-semibold">{pick(g.title, locale)}</span>
                <p className="mt-1 text-sm text-[#b0a284]">{pick(g.description, locale)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <AdSlot id="home-bottom" />
    </div>
  );
}
