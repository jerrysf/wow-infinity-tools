"use client";

import { useMemo, useState } from "react";
import type { ClassTalents, LocalizedText } from "@/lib/data/schema";
import { findNode } from "@/lib/talents/engine";
import { pick } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import type { Locale } from "@/i18n/config";
import { TalentMap } from "@/components/talents/TalentMap";

export type FollowStep = {
  min: number;
  max: number;
  spend: Record<string, number>;
  note?: LocalizedText;
};

/** Interactive "follow the guide" mode: drag the level slider and the talent
 *  map replays the build's leveling order step by step. */
export function FollowMode({
  data,
  steps,
  min,
  max,
  locale,
  dict,
}: {
  data: ClassTalents;
  steps: FollowStep[];
  min: number;
  max: number;
  locale: Locale;
  dict: Dictionary;
}) {
  const [level, setLevel] = useState(max);

  const current = useMemo(
    () =>
      steps.find((s) => level >= s.min && level <= s.max) ??
      [...steps].reverse().find((s) => s.min <= level) ??
      null,
    [steps, level],
  );

  const points = useMemo(() => {
    const merged: Record<string, number> = {};
    for (const step of steps) {
      if (step.min > level) break;
      for (const [id, pts] of Object.entries(step.spend)) {
        merged[id] = (merged[id] ?? 0) + pts;
      }
    }
    return merged;
  }, [steps, level]);

  const nodeName = (id: string) => {
    const found = findNode(data, id);
    return found ? pick(found.node.name, locale) : id;
  };

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-[#2a2f3a] bg-[#12161d] p-3">
        <div className="text-sm">
          <label htmlFor="follow-level" className="mr-2 font-medium text-[#e8d9a8]">
            {dict.talents.level}: {level}
          </label>
          <input
            id="follow-level"
            type="range"
            min={min}
            max={max}
            value={level}
            onChange={(e) => setLevel(Number(e.target.value))}
            className="w-48 align-middle accent-[#ffd100]"
          />
        </div>
        {current && (
          <p className="text-sm text-[#b0a284]">
            {dict.builds.followStep}:{" "}
            <span className="font-medium text-[#e8d9a8]">
              {dict.common.level} {current.min}-{current.max}
            </span>
            {" · "}
            {Object.entries(current.spend)
              .map(([id, pts]) => `${nodeName(id)} ×${pts}`)
              .join("、")}
          </p>
        )}
      </div>
      {current?.note && (
        <p className="mb-4 text-sm text-[#8a7a58]">{pick(current.note, locale)}</p>
      )}
      <TalentMap data={data} points={points} locale={locale} dict={dict} />
      <p className="mt-3 text-xs text-[#6b7280]">{dict.builds.followHint}</p>
    </div>
  );
}
