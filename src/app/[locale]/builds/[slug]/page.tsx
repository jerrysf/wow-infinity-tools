import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary, pick, t } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl, localizedPath } from "@/lib/site";
import { getBuildBySlug, getBuildDistribution, getBuilds, getClassById, getClassTalents, getGuides } from "@/lib/data";
import { findNode } from "@/lib/talents/engine";
import { TalentMap } from "@/components/talents/TalentMap";
import { encodeBuild } from "@/lib/talents/serialize";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { ProvenanceBlock } from "@/components/site/ProvenanceBlock";
import { StatusBadge } from "@/components/site/StatusBadge";
import { AdSlot } from "@/components/site/AdSlot";
import { BuildDemoBanner } from "@/components/builds/BuildsCatalog";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) => getBuilds().map((b) => ({ locale, slug: b.slug })));
}

export async function generateMetadata({ params }: PageProps<"/[locale]/builds/[slug]">): Promise<Metadata> {
  const { locale, slug } = await params;
  if (!isLocale(locale)) return {};
  const build = getBuildBySlug(slug);
  if (!build) return {};
  const title = pick(build.name, locale);
  const ogImage = absoluteUrl(`/og/builds/${slug}.${locale}.png`);
  const meta = pageMetadata({
    locale,
    path: `/builds/${slug}`,
    title,
    description: pick(build.summary, locale),
  });
  return {
    ...meta,
    openGraph: {
      ...meta.openGraph,
      images: [{ url: ogImage, width: 1200, height: 630, alt: title }],
    },
    twitter: { ...meta.twitter, images: [ogImage] },
  };
}

export default async function BuildPage({ params }: PageProps<"/[locale]/builds/[slug]">) {
  const { locale, slug } = await params;
  if (!isLocale(locale)) notFound();
  const build = getBuildBySlug(slug);
  if (!build) notFound();
  const dict = getDictionary(locale);
  const gameClass = getClassById(build.classId);
  const talents = getClassTalents(build.classId);
  const relatedGuide = getGuides().find((g) => g.relatedBuilds.includes(build.slug));
  const sameClassBuilds = getBuilds().filter((b) => b.classId === build.classId && b.slug !== build.slug);
  const isDemo = gameClass?.demo || talents?.demo || build.provenance.status === "unverified";

  const simLink = talents
    ? `${localizedPath(locale, `/talents/${gameClass!.slug}`)}?b=${encodeBuild(
        { classId: build.classId, level: build.levelRange.max, points: build.allocation },
        talents.gameVersion,
      )}`
    : null;

  const nodeName = (id: string) => {
    const found = talents ? findNode(talents, id) : null;
    return found ? pick(found.node.name, locale) : id;
  };

  const howToLd =
    build.levelingSteps.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "HowTo",
          name: pick(build.name, locale),
          description: pick(build.summary, locale),
          step: build.levelingSteps.map((step, i) => ({
            "@type": "HowToStep",
            position: i + 1,
            name: `${dict.common.level} ${step.levelRange}`,
            text: Object.entries(step.spend)
              .map(([id, pts]) => `${nodeName(id)} × ${pts}`)
              .join(", "),
          })),
        }
      : null;

  return (
    <div>
      {howToLd && <JsonLd data={howToLd} />}
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { href: "/builds", label: dict.builds.title },
          { label: pick(build.name, locale) },
        ]}
      />
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">{pick(build.name, locale)}</h1>
        {getBuildDistribution(build) && (
          <span className="font-mono text-lg font-semibold text-[#d8b558]">[{getBuildDistribution(build)}]</span>
        )}
        <StatusBadge status={build.provenance.status} needsRevalidation={build.provenance.needsRevalidation} dict={dict} />
      </div>
      {isDemo && <BuildDemoBanner demo dict={dict} />}
      <p className="mb-4 max-w-2xl text-[#b0a284]">{pick(build.summary, locale)}</p>

      <dl className="mb-6 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="font-medium text-[#8a7a58]">{dict.common.class}</dt>
          <dd>{gameClass ? pick(gameClass.name, locale) : build.classId}</dd>
        </div>
        <div>
          <dt className="font-medium text-[#8a7a58]">{dict.common.playstyle}</dt>
          <dd>{build.playstyle}</dd>
        </div>
        <div>
          <dt className="font-medium text-[#8a7a58]">{dict.builds.levelRange}</dt>
          <dd>
            {build.levelRange.min}-{build.levelRange.max}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-[#8a7a58]">{dict.common.version}</dt>
          <dd>{build.gameVersion}</dd>
        </div>
        {build.scenario && (
          <div>
            <dt className="font-medium text-[#8a7a58]">{dict.builds.scenario}</dt>
            <dd>{pick(build.scenario, locale)}</dd>
          </div>
        )}
        <div>
          <dt className="font-medium text-[#8a7a58]">{dict.common.updated}</dt>
          <dd>{build.updatedAt}</dd>
        </div>
      </dl>

      {simLink && (
        <Link
          href={simLink}
          className="btn-gold mb-6"
        >
          {dict.builds.loadInSimulator}
        </Link>
      )}

      {talents ? (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">{dict.builds.talentMap}</h2>
          <TalentMap data={talents} points={build.allocation} locale={locale} dict={dict} />
        </section>
      ) : (
        <section className="mb-6">
          <h2 className="mb-2 text-lg font-semibold">{dict.talents.pointsSpent}</h2>
          <ul className="list-inside list-disc text-sm text-[#cfc3a8]">
            {Object.entries(build.allocation).map(([nodeId, pts]) => (
              <li key={nodeId}>
                {nodeName(nodeId)} × {pts}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {build.levelingSteps.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">{dict.builds.levelingOrder}</h2>
            <ol className="space-y-3">
              {build.levelingSteps.map((step) => (
                <li key={step.levelRange} className="card p-3 text-sm">
                  <p className="font-medium">
                    {dict.common.level} {step.levelRange}
                  </p>
                  <p className="mt-1 text-[#b0a284]">
                    {Object.entries(step.spend)
                      .map(([id, pts]) => `${nodeName(id)} × ${pts}`)
                      .join(", ")}
                  </p>
                  {step.note && (
                    <p className="mt-1 text-xs text-[#8a7a58]">{pick(step.note, locale)}</p>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        {build.pros.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">{dict.builds.pros}</h2>
            <ul className="list-inside list-disc text-sm text-[#cfc3a8]">
              {build.pros.map((p, i) => (
                <li key={i}>{pick(p, locale)}</li>
              ))}
            </ul>
          </section>
        )}
        {build.cons.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">{dict.builds.cons}</h2>
            <ul className="list-inside list-disc text-sm text-[#cfc3a8]">
              {build.cons.map((c, i) => (
                <li key={i}>{pick(c, locale)}</li>
              ))}
            </ul>
          </section>
        )}
        {build.requirements.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">{dict.builds.requirements}</h2>
            <ul className="list-inside list-disc text-sm text-[#cfc3a8]">
              {build.requirements.map((r, i) => (
                <li key={i}>{pick(r, locale)}</li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {relatedGuide && (
        <p className="mt-6 text-sm">
          <Link
            href={localizedPath(locale, `/guides/${relatedGuide.slug}`)}
            className="text-amber-300 underline decoration-amber-300/40 underline-offset-2 hover:text-amber-200"
          >
            {dict.builds.guideLink}: {pick(relatedGuide.title, locale)}
          </Link>
        </p>
      )}

      {sameClassBuilds.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-3 text-xl font-semibold">
            {t(dict.builds.sameClass, { name: gameClass ? pick(gameClass.name, locale) : build.classId })}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {sameClassBuilds.map((b) => (
              <li key={b.slug}>
                <Link
                  href={localizedPath(locale, `/builds/${b.slug}`)}
                  className="card card-interactive block p-4"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{pick(b.name, locale)}</span>
                    {getBuildDistribution(b) && (
                      <span className="font-mono text-xs text-[#d8b558]">[{getBuildDistribution(b)}]</span>
                    )}
                    <StatusBadge status={b.provenance.status} dict={dict} />
                  </div>
                  <p className="mt-1 line-clamp-2 text-sm text-[#b0a284]">{pick(b.summary, locale)}</p>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="mt-6">
        <ProvenanceBlock provenance={build.provenance} dict={dict} />
      </div>
      <AdSlot id="build-bottom" />
    </div>
  );
}
