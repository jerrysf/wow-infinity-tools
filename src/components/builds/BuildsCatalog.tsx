"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { Build, GameClass } from "@/lib/data/schema";
import { pick } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import type { Locale } from "@/i18n/config";
import { localizedPath } from "@/lib/site";
import { StatusBadge, DemoBadge } from "@/components/site/StatusBadge";

type Filters = {
  classId: string;
  playstyle: string;
  status: string;
  difficulty: string;
};

const EMPTY: Filters = { classId: "", playstyle: "", status: "", difficulty: "" };

export function BuildsCatalog({
  builds,
  classes,
  locale,
  dict,
}: {
  builds: Build[];
  classes: GameClass[];
  locale: Locale;
  dict: Dictionary;
}) {
  const [filters, setFilters] = useState<Filters>(EMPTY);
  // Gate the URL-sync effect until the initial restore has landed, otherwise
  // the mount-time sync would wipe the incoming query params.
  const [ready, setReady] = useState(false);

  // Restore filters from the URL on mount so they survive locale switches and
  // shared links. Hydration from an external system; cannot run during SSR.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setFilters({
      classId: params.get("class") ?? "",
      playstyle: params.get("playstyle") ?? "",
      status: params.get("status") ?? "",
      difficulty: params.get("difficulty") ?? "",
    });
    setReady(true);
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (!ready) return;
    const params = new URLSearchParams(window.location.search);
    for (const [key, param] of [
      ["classId", "class"],
      ["playstyle", "playstyle"],
      ["status", "status"],
      ["difficulty", "difficulty"],
    ] as const) {
      if (filters[key]) params.set(param, filters[key]);
      else params.delete(param);
    }
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [filters, ready]);

  const classById = useMemo(() => new Map(classes.map((c) => [c.id, c])), [classes]);
  const playstyles = useMemo(
    () => [...new Set(builds.map((b) => b.playstyle))],
    [builds],
  );

  const visible = builds.filter(
    (b) =>
      (!filters.classId || b.classId === filters.classId) &&
      (!filters.playstyle || b.playstyle === filters.playstyle) &&
      (!filters.status || b.provenance.status === filters.status) &&
      (!filters.difficulty || b.difficulty === filters.difficulty),
  );

  const selectCls =
    "rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end gap-3" role="group" aria-label={dict.common.actions.filter}>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {dict.builds.filterClass}
          <select
            className={selectCls}
            value={filters.classId}
            onChange={(e) => setFilters({ ...filters, classId: e.target.value })}
          >
            <option value="">{dict.common.actions.all}</option>
            {classes.map((c) => (
              <option key={c.id} value={c.id}>
                {pick(c.name, locale)}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {dict.builds.filterPlaystyle}
          <select
            className={selectCls}
            value={filters.playstyle}
            onChange={(e) => setFilters({ ...filters, playstyle: e.target.value })}
          >
            <option value="">{dict.common.actions.all}</option>
            {playstyles.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {dict.builds.filterStatus}
          <select
            className={selectCls}
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">{dict.common.actions.all}</option>
            {(["unverified", "reviewed", "tested", "outdated"] as const).map((s) => (
              <option key={s} value={s}>
                {dict.common.status[s]}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs font-medium">
          {dict.builds.filterDifficulty}
          <select
            className={selectCls}
            value={filters.difficulty}
            onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
          >
            <option value="">{dict.common.actions.all}</option>
            {(["beginner", "intermediate", "advanced"] as const).map((d) => (
              <option key={d} value={d}>
                {dict.common.difficulty[d]}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          onClick={() => setFilters(EMPTY)}
          className="rounded border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
        >
          {dict.common.actions.clearFilters}
        </button>
      </div>

      {visible.length === 0 && <p className="text-zinc-500">{dict.builds.empty}</p>}
      <ul className="grid gap-4 sm:grid-cols-2">
        {visible.map((b) => {
          const c = classById.get(b.classId);
          return (
            <li key={b.slug}>
              <Link
                href={localizedPath(locale, `/builds/${b.slug}`)}
                className="block rounded-lg border border-zinc-200 p-4 hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-base font-semibold">{pick(b.name, locale)}</h2>
                  <StatusBadge status={b.provenance.status} needsRevalidation={b.provenance.needsRevalidation} dict={dict} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-zinc-600 dark:text-zinc-400">
                  {pick(b.summary, locale)}
                </p>
                <p className="mt-2 flex flex-wrap gap-x-3 text-xs text-zinc-500">
                  <span>{c ? pick(c.name, locale) : b.classId}</span>
                  <span>{b.playstyle}</span>
                  <span>
                    {dict.builds.levelRange}: {b.levelRange.min}-{b.levelRange.max}
                  </span>
                  <span>
                    {dict.common.version}: {b.gameVersion}
                  </span>
                  <span>
                    {dict.common.updated}: {b.updatedAt}
                  </span>
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

export function BuildDemoBanner({ demo, dict }: { demo: boolean; dict: Dictionary }) {
  if (!demo) return null;
  return (
    <p className="mb-4 flex items-center gap-2 rounded-lg border border-purple-200 bg-purple-50 p-3 text-sm text-purple-900 dark:border-purple-900 dark:bg-purple-950 dark:text-purple-200">
      <DemoBadge dict={dict} /> {dict.common.demoNoticeLong}
    </p>
  );
}
