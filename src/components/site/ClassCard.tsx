import Link from "next/link";
import type { GameClass } from "@/lib/data/schema";
import type { Locale } from "@/i18n/config";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import { pick } from "@/i18n/get-dictionary";
import { localizedPath } from "@/lib/site";
import { classColor } from "@/lib/class-colors";
import { DemoBadge } from "./StatusBadge";

export function ClassCard({
  gameClass,
  locale,
  dict,
}: {
  gameClass: GameClass;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <Link
      href={localizedPath(locale, `/talents/${gameClass.slug}`)}
      className="card card-interactive relative block overflow-hidden p-4"
    >
      <span
        aria-hidden
        className="absolute inset-x-0 top-0 h-1"
        style={{ background: `linear-gradient(90deg, ${classColor(gameClass.id)}, transparent 85%)` }}
      />
      <div className="mt-0.5 flex items-center gap-2">
        <span className="text-base font-bold" style={{ color: classColor(gameClass.id) }}>
          {pick(gameClass.name, locale)}
        </span>
        {gameClass.demo && <DemoBadge dict={dict} />}
      </div>
      {gameClass.tagline && (
        <p className="mt-1 text-sm text-[#9aa8bc]">{pick(gameClass.tagline, locale)}</p>
      )}
      {!gameClass.hasTalentData && (
        <p className="mt-1 text-xs text-[#75869c]">{dict.talents.dataPending}</p>
      )}
    </Link>
  );
}
