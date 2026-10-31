import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { itemListJsonLd, pageMetadata } from "@/lib/seo";
import { localizedPath } from "@/lib/site";
import { getBuilds, getBuildDistribution, getClasses } from "@/lib/data";
import { BuildsCatalog } from "@/components/builds/BuildsCatalog";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";
import { AdSlot } from "@/components/site/AdSlot";

export async function generateMetadata({ params }: PageProps<"/[locale]/builds">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/builds", title: dict.builds.title, description: dict.builds.description });
}

export default async function BuildsPage({ params }: PageProps<"/[locale]/builds">) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale);

  return (
    <div>
      <JsonLd
        data={itemListJsonLd(
          dict.builds.title,
          getBuilds().map((b) => ({
            name: pick(b.name, locale),
            path: localizedPath(locale, `/builds/${b.slug}`),
          })),
        )}
      />
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { label: dict.builds.title },
        ]}
      />
      <h1 className="mb-2 text-2xl font-bold">{dict.builds.title}</h1>
      <p className="mb-6 max-w-2xl text-[#9aa8bc]">{dict.builds.description}</p>
      <BuildsCatalog
        builds={getBuilds()}
        classes={getClasses()}
        distributions={Object.fromEntries(getBuilds().map((b) => [b.slug, getBuildDistribution(b)]))}
        locale={locale}
        dict={dict}
      />
      <AdSlot id="builds-bottom" />
    </div>
  );
}
