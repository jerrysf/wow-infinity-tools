import Link from "next/link";
import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { localizedPath } from "@/lib/site";
import { getClasses } from "@/lib/data";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { DemoBadge } from "@/components/site/StatusBadge";
import { classColor } from "@/lib/class-colors";

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
      <p className="mb-6 max-w-2xl text-[#b0a284]">{dict.talents.description}</p>
      <h2 className="mb-3 text-lg font-semibold">{dict.talents.selectClass}</h2>
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
                <p className="mt-2 text-xs font-medium text-amber-400">{dict.talents.dataPending}</p>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
