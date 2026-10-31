import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { getClasses, getSelectorConfig } from "@/lib/data";
import { QuizFlow } from "@/components/selector/QuizFlow";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

export async function generateMetadata({ params }: PageProps<"/[locale]/tools/class-selector">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/tools/class-selector", title: dict.selector.title, description: dict.selector.description });
}

export default async function ClassSelectorPage({ params }: PageProps<"/[locale]/tools/class-selector">) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale);
  const config = getSelectorConfig();
  const classes = getClasses();

  return (
    <div>
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { label: dict.selector.title },
        ]}
      />
      <h1 className="text-2xl font-bold">{dict.selector.heading}</h1>
      <p className="mt-2 mb-6 max-w-2xl text-[#b0a284]">{dict.selector.intro}</p>
      <QuizFlow config={config} classes={classes} locale={locale} dict={dict} />
    </div>
  );
}
