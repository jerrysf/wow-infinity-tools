import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import { Breadcrumbs } from "./Breadcrumbs";

export type InfoPageKey = keyof Dictionary["pages"];

/** Shared renderer for simple informational pages (about/privacy/etc). */
export function InfoPage({
  pageKey,
  locale,
  dict,
}: {
  pageKey: InfoPageKey;
  locale: Locale;
  dict: Dictionary;
}) {
  const page = dict.pages[pageKey];
  return (
    <div className="max-w-3xl">
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { label: page.title },
        ]}
      />
      <h1 className="mb-4 text-2xl font-bold">{page.title}</h1>
      {page.body.map((paragraph, i) => (
        <p key={i} className="mb-3 leading-relaxed text-[#b9c6d6]">
          {paragraph}
        </p>
      ))}
    </div>
  );
}
