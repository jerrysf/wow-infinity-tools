import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { getClasses } from "@/lib/data";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { ClassCard } from "@/components/site/ClassCard";

export async function generateMetadata({ params }: PageProps<"/[locale]/talents">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/talents", title: dict.talents.title, description: dict.talents.description });
}

export default async function TalentsIndexPage({ params }: PageProps<"/[locale]/talents">) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale);
  const classes = getClasses();

  return (
    <div>
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { label: dict.talents.title },
        ]}
      />
      <h1 className="mb-2 text-2xl font-bold">{dict.talents.title}</h1>
      <p className="mb-6 max-w-2xl text-[#9aa8bc]">{dict.talents.description}</p>
      <h2 className="mb-3 section-title text-lg font-semibold">{dict.talents.selectClass}</h2>
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {classes.map((c) => (
          <li key={c.id}>
            <ClassCard gameClass={c} locale={locale} dict={dict} />
          </li>
        ))}
      </ul>
    </div>
  );
}
