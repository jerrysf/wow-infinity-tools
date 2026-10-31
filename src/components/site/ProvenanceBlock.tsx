import type { Provenance } from "@/lib/data/schema";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import type { Locale } from "@/i18n/config";
import { StatusBadge } from "./StatusBadge";

/** Renders version + verification provenance for a piece of game data. */
export function ProvenanceBlock({
  provenance,
  versionLabel,
  dict,
}: {
  provenance: Provenance;
  versionLabel?: string;
  dict: Dictionary;
  locale?: Locale;
}) {
  return (
    <dl className="card flex flex-wrap gap-x-6 gap-y-2 p-3 text-xs text-[#7d8fa5]">
      <div>
        <dt className="inline font-medium">{dict.common.dataStatus}: </dt>
        <dd className="inline">
          <StatusBadge status={provenance.status} needsRevalidation={provenance.needsRevalidation} dict={dict} />
        </dd>
      </div>
      <div>
        <dt className="inline font-medium">{dict.common.version}: </dt>
        <dd className="inline">{versionLabel ?? provenance.gameVersion}</dd>
      </div>
      <div>
        <dt className="inline font-medium">{dict.common.source}: </dt>
        <dd className="inline">{provenance.source}</dd>
      </div>
      {provenance.lastVerifiedAt && (
        <div>
          <dt className="inline font-medium">{dict.common.lastVerified}: </dt>
          <dd className="inline">{provenance.lastVerifiedAt}</dd>
        </div>
      )}
    </dl>
  );
}
