import type { MetadataRoute } from "next";
import { locales } from "@/i18n/config";
import { absoluteUrl, localizedPath } from "@/lib/site";
import { getBuilds, getClasses, getGuides } from "@/lib/data";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPaths = [
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
  ];
  const dynamicPaths = [
    ...getClasses().map((c) => `/talents/${c.slug}`),
    ...getBuilds().map((b) => `/builds/${b.slug}`),
    ...getGuides().map((g) => `/guides/${g.slug}`),
  ];
  const urls: MetadataRoute.Sitemap = [];
  for (const path of [...staticPaths, ...dynamicPaths]) {
    for (const locale of locales) {
      urls.push({
        url: absoluteUrl(localizedPath(locale, path)),
        lastModified: new Date(),
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
