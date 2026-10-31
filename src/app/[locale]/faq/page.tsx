import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { absoluteUrl, localizedPath } from "@/lib/site";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { JsonLd } from "@/components/site/JsonLd";

export async function generateMetadata({ params }: PageProps<"/[locale]/faq">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({ locale, path: "/faq", title: dict.faq.title, description: dict.faq.description });
}

export default async function FaqPage({ params }: PageProps<"/[locale]/faq">) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: dict.faq.items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
    url: absoluteUrl(localizedPath(locale, "/faq")),
  };

  return (
    <div className="max-w-3xl">
      <JsonLd data={jsonLd} />
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { label: dict.faq.title },
        ]}
      />
      <h1 className="mb-6 text-2xl font-bold">{dict.faq.title}</h1>
      <dl className="space-y-5">
        {dict.faq.items.map((item, i) => (
          <div key={i} className="card p-4">
            <dt className="font-semibold">{item.q}</dt>
            <dd className="mt-2 text-sm leading-relaxed text-[#b0a284]">{item.a}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
