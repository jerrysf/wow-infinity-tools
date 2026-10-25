"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClassTalents, TalentNode } from "@/lib/data/schema";
import {
  allocate,
  emptyBuild,
  findNode,
  nodeAvailability,
  pointsAvailable,
  pointsSpent,
  refund,
  resetBuild,
  validateBuild,
  type AllocError,
  type BuildState,
  type NodeAvailability,
  type RefundError,
} from "@/lib/talents/engine";
import { buildSummaryText, decodeBuild, encodeBuild } from "@/lib/talents/serialize";
import { pick, t } from "@/i18n/get-dictionary";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";
import type { Locale } from "@/i18n/config";

const GRID_COLS = 4;

function requirementText(
  node: TalentNode,
  data: ClassTalents,
  state: BuildState,
  locale: Locale,
  dict: Dictionary,
): string[] {
  const lines: string[] = [];
  for (const req of node.requires) {
    const found = findNode(data, req.nodeId);
    const needed = req.points ?? 1;
    const have = state.points[req.nodeId] ?? 0;
    if (found && have < needed) {
      lines.push(
        t(dict.talents.requiresNode, { name: `${pick(found.node.name, locale)} (${have}/${needed})` }),
      );
    }
  }
  const tree = data.trees.find((tr) => tr.nodes.some((n) => n.id === node.id));
  if (tree && node.requiresPointsInTree > 0) {
    const spent = tree.nodes.reduce((s, n) => s + (state.points[n.id] ?? 0), 0);
    if (spent < node.requiresPointsInTree) {
      lines.push(t(dict.talents.requiresPoints, { points: `${spent}/${node.requiresPointsInTree}` }));
    }
  }
  if (node.minLevel && state.level < node.minLevel) {
    lines.push(t(dict.talents.requiresLevel, { level: node.minLevel }));
  }
  for (const ex of node.exclusiveWith) {
    if ((state.points[ex] ?? 0) > 0) {
      const found = findNode(data, ex);
      lines.push(`${dict.talents.exclusive}: ${found ? pick(found.node.name, locale) : ex}`);
    }
  }
  return lines;
}

const nodeStyles: Record<NodeAvailability, string> = {
  available:
    "border-blue-400 bg-blue-50 hover:bg-blue-100 dark:border-blue-700 dark:bg-blue-950/60 dark:hover:bg-blue-950",
  allocated:
    "border-green-500 bg-green-50 dark:border-green-700 dark:bg-green-950/60",
  maxed: "border-green-600 bg-green-100 dark:border-green-600 dark:bg-green-900/60",
  "locked-requires": "border-zinc-300 bg-zinc-100 opacity-70 dark:border-zinc-700 dark:bg-zinc-900",
  "locked-tree-points": "border-zinc-300 bg-zinc-100 opacity-70 dark:border-zinc-700 dark:bg-zinc-900",
  "locked-exclusivity": "border-zinc-300 bg-zinc-100 opacity-70 dark:border-zinc-700 dark:bg-zinc-900",
  "locked-level": "border-zinc-300 bg-zinc-100 opacity-70 dark:border-zinc-700 dark:bg-zinc-900",
  "locked-points": "border-zinc-300 bg-zinc-100 opacity-70 dark:border-zinc-700 dark:bg-zinc-900",
};

export function TalentSimulator({
  data,
  locale,
  dict,
}: {
  data: ClassTalents;
  locale: Locale;
  dict: Dictionary;
}) {
  const [build, setBuild] = useState<BuildState>(() =>
    emptyBuild(data.classId, data.rules.maxLevel),
  );
  const [activeTree, setActiveTree] = useState(data.trees[0].id);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);

  // Restore build from ?b= share param once on mount. Hydration from the URL;
  // cannot run during SSR, so the set-state-in-effect rule is disabled here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("b");
    if (raw) {
      const decoded = decodeBuild(raw);
      if (!decoded || decoded.state.classId !== data.classId) {
        setNotice(dict.talents.invalidLink);
      } else if (decoded.gameVersion !== data.gameVersion) {
        const violations = validateBuild(decoded.state, data);
        setBuild(violations.length === 0 ? decoded.state : emptyBuild(data.classId, decoded.state.level));
        setNotice(dict.talents.versionMismatch);
      } else {
        const violations = validateBuild(decoded.state, data);
        if (violations.length === 0) {
          setBuild(decoded.state);
        } else {
          setNotice(dict.talents.invalidLink);
        }
      }
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.classId, data.gameVersion]);
  /* eslint-enable react-hooks/set-state-in-effect */

  // Keep the URL in sync so copying the address bar always shares the build.
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams(window.location.search);
    const encoded = encodeBuild(build, data.gameVersion);
    if (pointsSpent(build) > 0) params.set("b", encoded);
    else params.delete("b");
    const qs = params.toString();
    window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
  }, [build, data.gameVersion, hydrated]);

  const spent = pointsSpent(build);
  const available = pointsAvailable(data, build.level);
  const overSpent = spent > available;
  const tree = data.trees.find((tr) => tr.id === activeTree) ?? data.trees[0];
  const maxRow = useMemo(() => Math.max(...tree.nodes.map((n) => n.row)), [tree]);

  function flash(kind: "error" | "notice", message: string | null) {
    if (kind === "error") setError(message);
    else setNotice(message);
  }

  function onAllocate(nodeId: string) {
    setError(null);
    setNotice(null);
    const result = allocate(build, data, nodeId);
    if ("error" in result) {
      flash("error", dict.talents.errors[result.error as AllocError]);
    } else {
      setBuild(result.state);
    }
  }

  function onRefund(nodeId: string) {
    setError(null);
    setNotice(null);
    const result = refund(build, data, nodeId);
    if ("error" in result) {
      flash("error", dict.talents.errors[result.error as RefundError]);
    } else {
      setBuild(result.state);
    }
  }

  function onLevelChange(level: number) {
    setError(null);
    const next = { ...build, level };
    // Validate: if the new level makes prerequisites illegal, reset rather
    // than carry an impossible state.
    const violations = validateBuild(next, data);
    setBuild(violations.length === 0 || violations.every((v) => v.reason === "no-points") ? next : resetBuild({ ...next, points: build.points }));
  }

  async function copyText(text: string, message: string) {
    try {
      await navigator.clipboard.writeText(text);
      flash("notice", message);
      setError(null);
    } catch {
      flash("error", text);
    }
  }

  function copyLink() {
    const encoded = encodeBuild(build, data.gameVersion);
    const url = `${window.location.origin}${window.location.pathname}?b=${encoded}`;
    copyText(url, dict.talents.linkCopied);
  }

  function copySummary() {
    copyText(
      buildSummaryText(build, (id) => {
        const found = findNode(data, id);
        return found ? pick(found.node.name, locale) : undefined;
      }),
      dict.talents.summaryCopied,
    );
  }

  return (
    <div>
      {/* Status bar */}
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
        <div className="text-sm">
          <label htmlFor="sim-level" className="mr-2 font-medium">
            {dict.talents.level}: {build.level}
          </label>
          <input
            id="sim-level"
            type="range"
            min={1}
            max={data.rules.maxLevel}
            value={build.level}
            onChange={(e) => onLevelChange(Number(e.target.value))}
            className="w-40 align-middle"
          />
        </div>
        <div className="text-sm">
          <span className={overSpent ? "font-semibold text-red-600 dark:text-red-400" : "font-medium"}>
            {dict.talents.pointsRemaining}: {Math.max(0, available - spent)}
          </span>
          <span className="ml-3 text-zinc-500">
            {dict.talents.pointsSpent}: {spent}/{available}
          </span>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setBuild(resetBuild(build)); setError(null); }}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {dict.talents.reset}
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="rounded bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-zinc-100 dark:text-zinc-900"
          >
            {dict.talents.share}
          </button>
          <button
            type="button"
            onClick={copySummary}
            className="rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            {dict.common.actions.copySummary}
          </button>
        </div>
      </div>

      {overSpent && (
        <p role="alert" className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {dict.talents.errors["no-points"]}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950 dark:text-red-200">
          {error}
        </p>
      )}
      {notice && !error && (
        <p role="status" className="mb-3 rounded-lg border border-blue-300 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-900 dark:bg-blue-950 dark:text-blue-200">
          {notice}
        </p>
      )}

      {/* Tree tabs */}
      <div className="mb-3 flex gap-1 overflow-x-auto" role="tablist" aria-label={dict.talents.tree}>
        {data.trees.map((tr) => {
          const treeSpent = tr.nodes.reduce((s, n) => s + (build.points[n.id] ?? 0), 0);
          const active = tr.id === activeTree;
          return (
            <button
              key={tr.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTree(tr.id)}
              className={`whitespace-nowrap rounded-t-lg border-b-2 px-4 py-2 text-sm font-medium ${
                active
                  ? "border-blue-600 text-blue-700 dark:border-blue-400 dark:text-blue-300"
                  : "border-transparent text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100"
              }`}
            >
              {pick(tr.name, locale)} ({treeSpent})
            </button>
          );
        })}
      </div>

      {/* Node grid: fixed column layout per data coordinates, scrollable on small screens */}
      <div className="overflow-x-auto pb-2">
        <div
          className="grid min-w-[560px] gap-2"
          style={{ gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))` }}
        >
          {Array.from({ length: maxRow + 1 }, (_, row) => row).flatMap((row) =>
            Array.from({ length: GRID_COLS }, (_, col) => {
              const node = tree.nodes.find((n) => n.row === row && n.col === col);
              if (!node) return <div key={`${row}-${col}`} />;
              const status = nodeAvailability(build, data, node.id);
              const allocated = build.points[node.id] ?? 0;
              const reqs = requirementText(node, data, build, locale, dict);
              const locked = status.startsWith("locked");
              return (
                <div
                  key={node.id}
                  className={`relative rounded-lg border-2 p-2 text-left ${nodeStyles[status]}`}
                  style={{ gridRow: row + 1, gridColumn: col + 1 }}
                >
                  <button
                    type="button"
                    onClick={() => onAllocate(node.id)}
                    disabled={status === "maxed"}
                    aria-label={`${pick(node.name, locale)} ${t(dict.talents.rank, { current: allocated, max: node.maxPoints })}`}
                    className="block w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
                  >
                    <span className="block text-sm font-semibold leading-tight">
                      {pick(node.name, locale)}
                    </span>
                    <span className="mt-0.5 block text-xs text-zinc-500 dark:text-zinc-400">
                      {status === "maxed"
                        ? dict.talents.maxRank
                        : t(dict.talents.rank, { current: allocated, max: node.maxPoints })}
                    </span>
                    <span className="mt-1 block text-xs leading-snug text-zinc-600 dark:text-zinc-400">
                      {pick(node.description, locale)}
                    </span>
                    {locked && reqs.length > 0 && (
                      <span className="mt-1 block text-xs font-medium text-amber-700 dark:text-amber-400">
                        {dict.talents.lockedNode}: {reqs.join("; ")}
                      </span>
                    )}
                  </button>
                  {allocated > 0 && (
                    <button
                      type="button"
                      onClick={() => onRefund(node.id)}
                      aria-label={`Refund ${pick(node.name, locale)}`}
                      className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 text-sm font-bold text-zinc-700 hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                    >
                      −
                    </button>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </div>
  );
}
