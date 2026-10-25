import type { DataStatus } from "@/lib/data/schema";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";

const styles: Record<DataStatus, string> = {
  unverified: "bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300",
  reviewed: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  tested: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300",
  outdated: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
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
      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${styles[status]}`}>
        {dict.common.status[status]}
      </span>
      {needsRevalidation && (
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {dict.common.status.needsRevalidation}
        </span>
      )}
    </span>
  );
}

export function DemoBadge({ dict }: { dict: Dictionary }) {
  return (
    <span className="rounded-full bg-purple-100 px-2 py-0.5 text-xs font-medium text-purple-800 dark:bg-purple-950 dark:text-purple-300">
      {dict.common.demoNotice}
    </span>
  );
}
