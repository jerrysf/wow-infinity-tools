import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { localizedPath } from "@/lib/site";
import { getBuildBySlug, getBuilds, getClassById, getClassTalents, getGuides } from "@/lib/data";
import { findNode } from "@/lib/talents/engine";
import { encodeBuild } from "@/lib/talents/serialize";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ProvenanceBlock } from "@/components/site/ProvenanceBlock";
import { StatusBadge } from "@/components/site/StatusBadge";
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
  return pageMetadata({
    locale,
    path: `/builds/${slug}`,
    title: pick(build.name, locale),
    description: pick(build.summary, locale),
  });
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

  return (
    <div>
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
        <StatusBadge status={build.provenance.status} needsRevalidation={build.provenance.needsRevalidation} dict={dict} />
      </div>
      {isDemo && <BuildDemoBanner demo dict={dict} />}
      <p className="mb-4 max-w-2xl text-zinc-600 dark:text-zinc-400">{pick(build.summary, locale)}</p>

      <dl className="mb-6 grid gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <dt className="font-medium text-zinc-500">{dict.common.class}</dt>
          <dd>{gameClass ? pick(gameClass.name, locale) : build.classId}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">{dict.common.playstyle}</dt>
          <dd>{build.playstyle}</dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">{dict.builds.levelRange}</dt>
          <dd>
            {build.levelRange.min}-{build.levelRange.max}
          </dd>
        </div>
        <div>
          <dt className="font-medium text-zinc-500">{dict.common.version}</dt>
          <dd>{build.gameVersion}</dd>
        </div>
        {build.scenario && (
          <div>
            <dt className="font-medium text-zinc-500">{dict.builds.scenario}</dt>
            <dd>{pick(build.scenario, locale)}</dd>
          </div>
        )}
        <div>
          <dt className="font-medium text-zinc-500">{dict.common.updated}</dt>
          <dd>{build.updatedAt}</dd>
        </div>
      </dl>

      {simLink && (
        <Link
          href={simLink}
          className="mb-6 inline-block rounded-lg bg-zinc-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-300"
        >
          {dict.builds.loadInSimulator}
        </Link>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-2 text-lg font-semibold">{dict.talents.pointsSpent}</h2>
          <ul className="list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
            {Object.entries(build.allocation).map(([nodeId, pts]) => (
              <li key={nodeId}>
                {nodeName(nodeId)} × {pts}
              </li>
            ))}
          </ul>
        </section>
        {build.levelingSteps.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">{dict.builds.levelingOrder}</h2>
            <ol className="space-y-3">
              {build.levelingSteps.map((step) => (
                <li key={step.levelRange} className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
                  <p className="font-medium">
                    {dict.common.level} {step.levelRange}
                  </p>
                  <p className="mt-1 text-zinc-600 dark:text-zinc-400">
                    {Object.entries(step.spend)
                      .map(([id, pts]) => `${nodeName(id)} × ${pts}`)
                      .join(", ")}
                  </p>
                  {step.note && (
                    <p className="mt-1 text-xs text-zinc-500">{pick(step.note, locale)}</p>
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
            <ul className="list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
              {build.pros.map((p, i) => (
                <li key={i}>{pick(p, locale)}</li>
              ))}
            </ul>
          </section>
        )}
        {build.cons.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">{dict.builds.cons}</h2>
            <ul className="list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
              {build.cons.map((c, i) => (
                <li key={i}>{pick(c, locale)}</li>
              ))}
            </ul>
          </section>
        )}
        {build.requirements.length > 0 && (
          <section>
            <h2 className="mb-2 text-lg font-semibold">{dict.builds.requirements}</h2>
            <ul className="list-inside list-disc text-sm text-zinc-700 dark:text-zinc-300">
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
            className="text-blue-700 underline dark:text-blue-400"
          >
            {dict.builds.guideLink}: {pick(relatedGuide.title, locale)}
          </Link>
        </p>
      )}

      <div className="mt-6">
        <ProvenanceBlock provenance={build.provenance} dict={dict} />
      </div>
    </div>
  );
}
