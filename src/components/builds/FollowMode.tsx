"use client";

import { useEffect, useMemo, useState } from "react";
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
  const [playing, setPlaying] = useState(false);

  // Autoplay: advance one level every ~900ms, stop at max.
  useEffect(() => {
    if (!playing || level >= max) return;
    const timer = setTimeout(() => {
      if (level + 1 >= max) setPlaying(false);
      setLevel(Math.min(level + 1, max));
    }, 900);
    return () => clearTimeout(timer);
  }, [playing, level, max]);

  function togglePlay() {
    setLevel((l) => (l >= max ? min : l));
    setPlaying((p) => !p);
  }

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
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-[#263446] bg-[#101824] p-3">
        <div className="text-sm">
          <label htmlFor="follow-level" className="mr-2 font-medium text-[#f0e5c0]">
            {dict.talents.level}: {level}
          </label>
          <input
            id="follow-level"
            type="range"
            min={min}
            max={max}
            value={level}
            onChange={(e) => {
            setLevel(Number(e.target.value));
            setPlaying(false);
          }}
            className="w-48 align-middle accent-[#ffd100]"
          />
        </div>
        <button
          type="button"
          onClick={togglePlay}
          aria-label={playing ? dict.builds.followPause : dict.builds.followPlay}
          className="rounded border border-[#b08428] bg-[#16202e] px-3 py-1.5 text-sm font-medium text-[#ffd100] hover:bg-[#22304a]"
        >
          {playing ? "⏸ " + dict.builds.followPause : "▶ " + dict.builds.followPlay}
        </button>
        {current && (
          <p className="text-sm text-[#9aa8bc]">
            {dict.builds.followStep}:{" "}
            <span className="font-medium text-[#f0e5c0]">
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
        <p className="mb-4 text-sm text-[#7d8fa5]">{pick(current.note, locale)}</p>
      )}
      <TalentMap data={data} points={points} locale={locale} dict={dict} />
      <p className="mt-3 text-xs text-[#8b93a1]">{dict.builds.followHint}</p>
    </div>
  );
}
