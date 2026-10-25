import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { getBuilds, getClasses } from "@/lib/data";
import { BuildsCatalog } from "@/components/builds/BuildsCatalog";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

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
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { label: dict.builds.title },
        ]}
      />
      <h1 className="mb-2 text-2xl font-bold">{dict.builds.title}</h1>
      <p className="mb-6 max-w-2xl text-zinc-600 dark:text-zinc-400">{dict.builds.description}</p>
      <BuildsCatalog builds={getBuilds()} classes={getClasses()} locale={locale} dict={dict} />
    </div>
  );
}
