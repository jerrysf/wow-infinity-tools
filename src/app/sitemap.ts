import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { absoluteUrl, localizedPath } from "@/lib/site";
import { getBuilds, getClasses, getCurrentVersion, getGuides } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const dataDate = [
    getCurrentVersion().releasedAt,
    ...getBuilds().map((b) => b.updatedAt),
    ...getGuides().map((g) => g.updatedAt),
  ]
    .filter(Boolean)
    .sort()
    .at(-1) as string;

  const entries: { path: string; date: string }[] = [
    ...[
      "/",
      "/tools/class-selector",
      "/talents",
      "/builds",
      "/guides",
      "/faq",
      "/changelog",
      "/about",
      "/contact",
      "/privacy",
      "/disclaimer",
      "/disclosure",
    ].map((path) => ({ path, date: dataDate })),
    ...getClasses().map((c) => ({ path: `/talents/${c.slug}`, date: getCurrentVersion().releasedAt ?? dataDate })),
    ...getBuilds().map((b) => ({ path: `/builds/${b.slug}`, date: b.updatedAt })),
    ...getGuides().map((g) => ({ path: `/guides/${g.slug}`, date: g.updatedAt })),
  ];

  const urls: MetadataRoute.Sitemap = [];
  for (const { path, date } of entries) {
    for (const locale of locales) {
      urls.push({
        url: absoluteUrl(localizedPath(locale, path)),
        lastModified: new Date(date),
        alternates: {
          languages: Object.fromEntries([
            ...locales.map((l) => [l === "zh-cn" ? "zh-CN" : "en-US", absoluteUrl(localizedPath(l, path))]),
            ["x-default", absoluteUrl(localizedPath("zh-cn", path))],
          ]),
        },
      });
    }
  }
  return urls;
}
