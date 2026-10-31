import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { localizedPath } from "@/lib/site";
import { getBuilds, getBuildDistribution, getClassBySlug, getClassTalents, getClasses, getGameVersions, getGuides } from "@/lib/data";
import { TalentSimulator } from "@/components/talents/TalentSimulator";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ProvenanceBlock } from "@/components/site/ProvenanceBlock";
import { BuildDemoBanner } from "@/components/builds/BuildsCatalog";
import { DemoBadge } from "@/components/site/StatusBadge";
import { classColor } from "@/lib/class-colors";
import { BuildCard } from "@/components/builds/BuildCard";

export const dynamicParams = false;

export function generateStaticParams() {
  return locales.flatMap((locale) =>
    getClasses().map((c) => ({ locale, class: c.slug })),
  );
}

export async function generateMetadata({ params }: PageProps<"/[locale]/talents/[class]">): Promise<Metadata> {
  const { locale, class: slug } = await params;
  if (!isLocale(locale)) return {};
  const gameClass = getClassBySlug(slug);
  if (!gameClass) return {};
  const dict = getDictionary(locale);
  const className = pick(gameClass.name, locale);
  return pageMetadata({
    locale,
    path: `/talents/${slug}`,
    title: `${className} - ${dict.talents.title}`,
    description: `${className}: ${dict.talents.description}`,
  });
}

export default async function ClassTalentsPage({ params }: PageProps<"/[locale]/talents/[class]">) {
  const { locale, class: slug } = await params;
  if (!isLocale(locale)) notFound();
  const gameClass = getClassBySlug(slug);
  if (!gameClass) notFound();
  const dict = getDictionary(locale);
  const talents = getClassTalents(gameClass.id);
  const versionLabel = getGameVersions().find((v) => v.id === (talents?.gameVersion ?? gameClass.provenance.gameVersion))?.label;
  const classBuilds = getBuilds().filter((b) => b.classId === gameClass.id);
  const classGuide = getGuides().find((g) => g.classId === gameClass.id);

  return (
    <div>
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { href: "/talents", label: dict.talents.title },
          { label: pick(gameClass.name, locale) },
        ]}
      />
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <h1 className="text-2xl font-bold">
          <span style={{ color: classColor(gameClass.id) }}>{pick(gameClass.name, locale)}</span>
          {" - "}
          {dict.talents.title}
        </h1>
        {gameClass.demo && <DemoBadge dict={dict} />}
      </div>
      {gameClass.demo && <BuildDemoBanner demo={gameClass.demo} dict={dict} />}
      <div className="mb-4 max-w-2xl space-y-1 text-sm text-[#9aa8bc]">
        {gameClass.tagline && <p>{pick(gameClass.tagline, locale)}</p>}
        {(gameClass.strengths || gameClass.drawbacks) && (
          <p>
            {gameClass.strengths && (
              <span className="font-medium text-emerald-400">{pick(gameClass.strengths, locale)}</span>
            )}
            {gameClass.strengths && gameClass.drawbacks && " · "}
            {gameClass.drawbacks && (
              <span className="text-[#7d8fa5]">{pick(gameClass.drawbacks, locale)}</span>
            )}
          </p>
        )}
      </div>
      {talents ? (
        <>
          <div className="mb-4">
            <ProvenanceBlock provenance={talents.provenance} versionLabel={versionLabel} dict={dict} />
          </div>
          <TalentSimulator data={talents} locale={locale} dict={dict} />
        </>
      ) : (
        <p className="card p-4 text-[#9aa8bc]">{dict.talents.dataPending}</p>
      )}

      {(classBuilds.length > 0 || classGuide) && (
        <section className="mt-10">
          <h2 className="mb-3 section-title text-xl font-semibold">
            {pick(gameClass.name, locale)} · {dict.builds.title}
          </h2>
          <ul className="grid gap-3 sm:grid-cols-2">
            {classBuilds.map((b) => (
              <li key={b.slug}>
                <BuildCard
                  build={b}
                  gameClass={gameClass}
                  distribution={getBuildDistribution(b)}
                  locale={locale}
                  dict={dict}
                />
              </li>
            ))}
            {classGuide && (
              <li>
                <Link
                  href={localizedPath(locale, `/guides/${classGuide.slug}`)}
                  className="card card-interactive block p-4"
                >
                  <span className="font-semibold">{pick(classGuide.title, locale)}</span>
                  <p className="mt-1 text-sm text-[#9aa8bc]">{pick(classGuide.description, locale)}</p>
                </Link>
              </li>
            )}
          </ul>
        </section>
      )}
    </div>
  );
}
