import Link from "next/link";
import type { Metadata } from "next";
import { isLocale, localeLangTags } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl, localizedPath, site } from "@/lib/site";
import { JsonLd } from "@/components/site/JsonLd";
import { getBuilds, getClasses, getBuildDistribution, getClassTalents, getCommunityLinks, getCommunityVideos, getCurrentVersion, getGuides } from "@/lib/data";
import { StatusBadge } from "@/components/site/StatusBadge";
import { ClassCard } from "@/components/site/ClassCard";
import { VideoThumbnail } from "@/components/site/VideoThumbnail";
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
  const allBuilds = getBuilds();
  const allGuides = getGuides();
  const builds = allBuilds.slice(0, 4);
  const guides = allGuides.slice(0, 4);
  const version = getCurrentVersion();
  const classById = new Map(classes.map((c) => [c.id, c]));
  const videos = getCommunityVideos();
  const communityLinks = getCommunityLinks();

  const videoUrl = (v: (typeof videos)[number]) =>
    locale === "zh-cn"
      ? v.bilibiliBv
        ? `https://www.bilibili.com/video/${v.bilibiliBv}/`
        : `https://www.youtube.com/watch?v=${v.youtubeId}`
      : v.youtubeId
        ? `https://www.youtube.com/watch?v=${v.youtubeId}`
        : `https://www.bilibili.com/video/${v.bilibiliBv}/`;
  const videoPlatform = (v: (typeof videos)[number]) => {
    const usesBilibili = locale === "zh-cn" ? Boolean(v.bilibiliBv) : !v.youtubeId;
    return usesBilibili ? (locale === "zh-cn" ? "哔哩哔哩" : "Bilibili") : "YouTube";
  };

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
        className="relative my-2 overflow-hidden rounded-2xl border border-[#26334a] px-7 py-10 sm:px-10 sm:py-12"
        style={{
          background:
            "radial-gradient(ellipse at 20% -20%, rgba(240,188,74,0.14), transparent 55%), radial-gradient(ellipse at 85% 115%, rgba(59,90,160,0.2), transparent 55%), linear-gradient(180deg, #0f1826 0%, #0a0e14 100%)",
        }}
      >
        <p className="eyebrow">{dict.home.heroEyebrow}</p>
        <h1 className="mt-2 max-w-2xl text-4xl font-extrabold tracking-tight text-white sm:text-5xl">
          {dict.home.heroTitle}
        </h1>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-[#9aa8bc]">{dict.home.heroSubtitle}</p>
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
        <dl className="mt-7 flex flex-wrap gap-x-8 gap-y-3 border-t border-[#26334a]/70 pt-5">
          {[
            [classes.length, dict.home.statsClasses],
            [classes.reduce((n, c) => n + (getClassTalents(c.id)?.trees.length ?? 0), 0), dict.home.statsTrees],
            [allBuilds.length, dict.home.statsBuilds],
            [allGuides.length, dict.home.statsGuides],
          ].map(([num, label]) => (
            <div key={String(label)}>
              <dt className="sr-only">{label}</dt>
              <dd className="text-3xl font-extrabold text-[#f0bc4a]">{num}</dd>
              <dd className="text-xs text-[#7d8fa5]">{label}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-5 text-xs text-[#75869c]">
          {dict.common.version}: {version.label} · {dict.common.dataStatus}:{" "}
          {dict.common.status[classes[0]?.provenance.status ?? "unverified"]}
        </p>
      </section>

      <section className="card mb-8 p-4 text-sm text-[#9aa8bc]">
        <h2 className="mb-1 font-semibold text-[#e6edf5]">{dict.home.dataNotice}</h2>
        <p>{dict.home.dataNoticeBody}</p>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 section-title text-xl font-semibold">{dict.home.classesTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {classes.map((c) => (
            <li key={c.id}>
              <ClassCard gameClass={c} locale={locale} dict={dict} />
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 section-title text-xl font-semibold">{dict.home.videosTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {videos.map((v) => (
            <li key={v.slug}>
              <a
                href={videoUrl(v)}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-interactive block overflow-hidden"
              >
                <div className="relative">
                  {v.youtubeId ? (
                    <VideoThumbnail videoId={v.youtubeId} alt={pick(v.title, locale)} />
                  ) : (
                    <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-[#1a2433] to-[#0c1219] text-4xl text-[#c99632]">
                      ▶
                    </div>
                  )}
                  <span
                    aria-hidden
                    className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                  />
                  <span className="absolute bottom-2 right-2 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                    {videoPlatform(v)}
                  </span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-semibold leading-snug">{pick(v.title, locale)}</h3>
                  {v.description && (
                    <p className="mt-1 line-clamp-2 text-xs text-[#9aa8bc]">{pick(v.description, locale)}</p>
                  )}
                  <p className="mt-2 text-xs text-[#75869c]">
                    {pick(v.channel, locale)} · {videoPlatform(v)}
                  </p>
                </div>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 section-title text-xl font-semibold">{dict.home.featuredBuilds}</h2>
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
                <p className="mt-1 text-sm text-[#9aa8bc]">{pick(b.summary, locale)}</p>
                <p className="mt-2 text-xs text-[#75869c]">
                  {getBuildDistribution(b) && (
                    <span className="font-mono text-[#f0bc4a]">[{getBuildDistribution(b)}] </span>
                  )}
                  {classById.get(b.classId) ? pick(classById.get(b.classId)!.name, locale) : b.classId} ·{" "}
                  {b.playstyle} · {dict.common.version}: {b.gameVersion} · {dict.common.updated}: {b.updatedAt}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10">
        <h2 className="mb-4 section-title text-xl font-semibold">{dict.home.guidesTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {guides.map((g) => (
            <li key={g.slug}>
              <Link
                href={localizedPath(locale, `/guides/${g.slug}`)}
                className="card card-interactive block p-4"
              >
                <span className="font-semibold">{pick(g.title, locale)}</span>
                <p className="mt-1 text-sm text-[#9aa8bc]">{pick(g.description, locale)}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section className="mb-10">
        <h2 className="mb-4 section-title text-xl font-semibold">{dict.home.communityTitle}</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {communityLinks.map((link) => (
            <li key={link.slug}>
              <a
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                className="card card-interactive block p-4"
              >
                <span className="font-semibold text-amber-300">{pick(link.name, locale)}</span>
                <p className="mt-1 text-sm text-[#9aa8bc]">{pick(link.description, locale)}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>

      <AdSlot id="home-bottom" />
    </div>
  );
}
