import type { ClassTalents, TalentTree } from "@/lib/data/schema";
import type { NodeAvailability } from "@/lib/talents/engine";
import { pick, t } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import type { Locale } from "@/i18n/config";
import { GRID_COLS, PrereqArrows, iconClasses, rankClasses, tileClasses } from "./tree-shared";

function statusOf(allocated: number, maxPoints: number): NodeAvailability {
  if (allocated <= 0) return "locked-requires";
  return allocated >= maxPoints ? "maxed" : "allocated";
}

function ReadOnlyTree({
  tree,
  points,
  locale,
  dict,
}: {
  tree: TalentTree;
  points: Record<string, number>;
  locale: Locale;
  dict: Dictionary;
}) {
  const rows = Math.max(...tree.nodes.map((n) => n.row)) + 1;
  const spent = tree.nodes.reduce((sum, n) => sum + (points[n.id] ?? 0), 0);
  return (
    <section
      aria-label={`${pick(tree.name, locale)} ${spent}`}
      className="rounded-md border border-[#2a2f3a] bg-gradient-to-b from-[#151a21] to-[#0d1015] p-2.5"
    >
      <header className="mb-3 flex items-baseline justify-between border-b border-[#2a2f3a] pb-1.5">
        <h3 className="text-sm font-semibold tracking-wide text-[#e8d9a8]">{pick(tree.name, locale)}</h3>
        <span className={`text-xs font-semibold ${spent > 0 ? "text-[#ffd100]" : "text-[#8b93a1]"}`}>{spent}</span>
      </header>
      <div className="relative">
        <PrereqArrows tree={tree} rows={rows} points={points} />
        <div className="relative grid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: "0.4rem" }}>
          {Array.from({ length: rows }, (_, row) => row).flatMap((row) =>
            Array.from({ length: GRID_COLS }, (_, col) => {
              const node = tree.nodes.find((n) => n.row === row && n.col === col);
              if (!node) return <div key={`${row}-${col}`} className="aspect-square" />;
              const allocated = points[node.id] ?? 0;
              const status = statusOf(allocated, node.maxPoints);
              return (
                <div key={node.id} className="mb-5" style={{ gridRow: row + 1, gridColumn: col + 1 }}>
                  <div
                    title={`${pick(node.name, locale)} ${t(dict.talents.rank, { current: allocated, max: node.maxPoints })}`}
                    className={`relative aspect-square w-full max-w-11 rounded border-2 bg-[#0b0d10] ${tileClasses(status)}`}
                  >
                    {node.icon ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={`/icons/${node.icon}`}
                        alt=""
                        width={56}
                        height={56}
                        loading="lazy"
                        className={`h-full w-full rounded-sm object-cover ${iconClasses(status)}`}
                      />
                    ) : (
                      <span className={`flex h-full w-full items-center justify-center text-sm font-bold text-[#9ca3af] ${iconClasses(status)}`}>
                        {pick(node.name, locale).slice(0, 1)}
                      </span>
                    )}
                    <span
                      className={`pointer-events-none absolute inset-x-0 -bottom-5 text-center text-[11px] font-semibold leading-none ${rankClasses(status)}`}
                    >
                      {t(dict.talents.rank, { current: allocated, max: node.maxPoints })}
                    </span>
                  </div>
                </div>
              );
            }),
          )}
        </div>
      </div>
    </section>
  );
}

/** Static, read-only render of a saved allocation across all three trees —
 *  the same visual language as the interactive simulator. */
export function TalentMap({
  data,
  points,
  locale,
  dict,
}: {
  data: ClassTalents;
  points: Record<string, number>;
  locale: Locale;
  dict: Dictionary;
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-3">
      {data.trees.map((tree) => (
        <ReadOnlyTree key={tree.id} tree={tree} points={points} locale={locale} dict={dict} />
      ))}
    </div>
  );
}
