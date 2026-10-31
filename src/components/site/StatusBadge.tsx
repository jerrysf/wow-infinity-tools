import type { DataStatus } from "@/lib/data/schema";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";

const pill =
  "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium";

const styles: Record<DataStatus, string> = {
  unverified: "border-slate-400/30 bg-slate-500/10 text-slate-300",
  reviewed: "border-blue-400/30 bg-blue-500/10 text-blue-300",
  tested: "border-emerald-400/30 bg-emerald-500/10 text-emerald-300",
  outdated: "border-amber-400/30 bg-amber-500/10 text-amber-300",
};

export function StatusBadge({
  status,
  needsRevalidation,
  dict,
}: {
  status: DataStatus;
  needsRevalidation?: boolean;
  dict: Dictionary;
}) {
  return (
    <span className="inline-flex items-center gap-1">
      <span className={`${pill} ${styles[status]}`}>{dict.common.status[status]}</span>
      {needsRevalidation && (
        <span className={`${pill} border-orange-400/30 bg-orange-500/10 text-orange-300`}>
          {dict.common.status.needsRevalidation}
        </span>
      )}
    </span>
  );
}

export function DemoBadge({ dict }: { dict: Dictionary }) {
  return (
    <span className={`${pill} border-purple-400/30 bg-purple-500/10 text-purple-300`}>
      {dict.common.demoNotice}
    </span>
  );
}
