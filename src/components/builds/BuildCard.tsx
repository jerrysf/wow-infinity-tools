import Link from "next/link";
import type { Build, GameClass } from "@/lib/data/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import { pick } from "@/i18n/get-dictionary";
import { localizedPath } from "@/lib/site";
import { classColor } from "@/lib/class-colors";
import { StatusBadge } from "@/components/site/StatusBadge";

export function BuildCard({
  build,
  gameClass,
  distribution,
  locale,
  dict,
}: {
  build: Build;
  gameClass?: GameClass;
  distribution?: string | null;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <Link
      href={localizedPath(locale, `/builds/${build.slug}`)}
      className="card card-interactive relative block overflow-hidden p-4"
    >
      {gameClass && (
        <span
          aria-hidden
          className="absolute inset-x-0 top-0 h-1"
          style={{ background: `linear-gradient(90deg, ${classColor(gameClass.id)}, transparent 85%)` }}
        />
      )}
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-base font-semibold">{pick(build.name, locale)}</h2>
        <StatusBadge
          status={build.provenance.status}
          needsRevalidation={build.provenance.needsRevalidation}
          dict={dict}
        />
      </div>
      <p className="mt-1 line-clamp-2 text-sm text-[#9aa8bc]">{pick(build.summary, locale)}</p>
      <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-[#75869c]">
        {distribution && <span className="font-mono text-[#f0bc4a]">[{distribution}]</span>}
        <span style={gameClass ? { color: classColor(gameClass.id) } : undefined}>
          {gameClass ? pick(gameClass.name, locale) : build.classId}
        </span>
        <span>{build.playstyle}</span>
        <span>
          {dict.builds.levelRange}: {build.levelRange.min}-{build.levelRange.max}
        </span>
        <span>
          {dict.common.version}: {build.gameVersion}
        </span>
        <span>
          {dict.common.updated}: {build.updatedAt}
        </span>
      </p>
    </Link>
  );
}
