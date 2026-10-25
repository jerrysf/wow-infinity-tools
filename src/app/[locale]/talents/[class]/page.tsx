import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { isLocale, locales } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { getClassBySlug, getClassTalents, getClasses, getGameVersions } from "@/lib/data";
import { TalentSimulator } from "@/components/talents/TalentSimulator";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ProvenanceBlock } from "@/components/site/ProvenanceBlock";
import { BuildDemoBanner } from "@/components/builds/BuildsCatalog";
import { DemoBadge } from "@/components/site/StatusBadge";

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
          {pick(gameClass.name, locale)} - {dict.talents.title}
        </h1>
        {gameClass.demo && <DemoBadge dict={dict} />}
      </div>
      {gameClass.demo && <BuildDemoBanner demo={gameClass.demo} dict={dict} />}
      {talents ? (
        <>
          <div className="mb-4">
            <ProvenanceBlock provenance={talents.provenance} versionLabel={versionLabel} dict={dict} />
          </div>
          <TalentSimulator data={talents} locale={locale} dict={dict} />
        </>
      ) : (
        <p className="rounded-lg border border-zinc-200 p-4 text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
          {dict.talents.dataPending}
        </p>
      )}
    </div>
  );
}
