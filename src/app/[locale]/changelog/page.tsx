import type { Metadata } from "next";
import { isLocale } from "@/i18n/config";
import { getDictionary, pick } from "@/i18n/get-dictionary";
import { pageMetadata } from "@/lib/seo";
import { getChangelogs, getClassById, getGameVersions } from "@/lib/data";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { classColor } from "@/lib/class-colors";

export async function generateMetadata({ params }: PageProps<"/[locale]/changelog">): Promise<Metadata> {
  const { locale } = await params;
  if (!isLocale(locale)) return {};
  const dict = getDictionary(locale);
  return pageMetadata({
    locale,
    path: "/changelog",
    title: dict.changelog.title,
    description: dict.changelog.description,
  });
}

export default async function ChangelogPage({ params }: PageProps<"/[locale]/changelog">) {
  const { locale } = await params;
  if (!isLocale(locale)) return null;
  const dict = getDictionary(locale);
  const versions = getGameVersions();
  const changelogs = getChangelogs();

  const fieldLabel = (field: string): string =>
    (dict.changelog.fields as Record<string, string>)[field] ?? field;

  const formatField = (field: string, value: unknown): string => {
    const label = fieldLabel(field);
    if (Array.isArray(value) && value.length === 2) {
      return `${label} ${String(value[0] ?? "—")} → ${String(value[1] ?? "—")}`;
    }
    return label;
  };

  return (
    <div>
      <Breadcrumbs
        locale={locale}
        items={[
          { href: "/", label: dict.common.breadcrumbHome },
          { label: dict.changelog.title },
        ]}
      />
      <h1 className="mb-2 text-2xl font-bold">{dict.changelog.title}</h1>
      <p className="mb-6 max-w-2xl text-[#9aa8bc]">{dict.changelog.description}</p>

      <section className="mb-8">
        <h2 className="mb-3 section-title text-lg font-semibold">{dict.changelog.versionsTitle}</h2>
        <ul className="space-y-2">
          {versions.map((v) => (
            <li key={v.id} className="card flex flex-wrap items-center gap-x-3 p-3 text-sm">
              <span className="font-mono font-semibold text-[#f0bc4a]">{v.label}</span>
              {v.isCurrent && (
                <span className="rounded border border-[#b08428] bg-[#16202e] px-1.5 py-0.5 text-xs text-[#ffd100]">
                  {dict.changelog.current}
                </span>
              )}
              <span className="text-xs text-[#75869c]">{v.releasedAt}</span>
            </li>
          ))}
        </ul>
      </section>

      {changelogs.length === 0 && (
        <p className="card p-4 text-sm text-[#9aa8bc]">{dict.changelog.empty}</p>
      )}

      {changelogs.map((log) => (
        <section key={`${log.fromVersion}-${log.toVersion}`} className="mb-8">
          <h2 className="mb-1 section-title text-lg font-semibold">
            {log.fromVersion} → {log.toVersion}
          </h2>
          <p className="mb-4 text-xs text-[#75869c]">{log.generatedAt}</p>
          {log.classes.map((cls) => {
            const gameClass = getClassById(cls.classId);
            return (
              <div key={cls.classId} className="card mb-4 p-4">
                <h3 className="mb-2 font-semibold" style={{ color: classColor(cls.classId) }}>
                  {gameClass ? pick(gameClass.name, locale) : cls.classId}
                </h3>
                {cls.trees.map((tree) => (
                  <div key={tree.treeId} className="mb-3 last:mb-0">
                    <h4 className="mb-1 text-sm font-medium text-[#f0e5c0]">{pick(tree.treeName, locale)}</h4>
                    <ul className="space-y-1 text-sm text-[#b9c6d6]">
                      {tree.added.map((n) => (
                        <li key={n.id}>
                          <span className="mr-1 text-emerald-400">+</span>
                          {pick(n.name, locale)}
                          <span className="ml-1 text-xs text-[#75869c]">({dict.changelog.added})</span>
                        </li>
                      ))}
                      {tree.removed.map((n) => (
                        <li key={n.id} className="text-[#7d8fa5] line-through">
                          <span className="mr-1 text-red-400">−</span>
                          {pick(n.name, locale)}
                          <span className="ml-1 text-xs">({dict.changelog.removed})</span>
                        </li>
                      ))}
                      {tree.changed.map((c) => (
                        <li key={c.nodeId}>
                          <span className="mr-1 text-amber-300">~</span>
                          {pick(c.name, locale)}
                          <span className="ml-1 text-xs text-[#75869c]">
                            {Object.entries(c.fields).map(([f, v]) => formatField(f, v)).join(" · ")}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            );
          })}
        </section>
      ))}
    </div>
  );
}
