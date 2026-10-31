"use client";

import { useEffect, useMemo, useState } from "react";
import type { ClassTalents, TalentNode, TalentTree } from "@/lib/data/schema";
import {
  allocate,
  emptyBuild,
  findNode,
  nodeAvailability,
  pointsAvailable,
  pointsSpent,
  refund,
  resetBuild,
  treePointsSpent,
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
import { GRID_COLS, PrereqArrows, iconClasses, rankClasses, tileClasses } from "./tree-shared";

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
    const spent = treePointsSpent(state, data, tree.id);
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

function TalentTile({
  node,
  status,
  allocated,
  selected,
  locale,
  dict,
  onAllocate,
  onRefund,
}: {
  node: TalentNode;
  status: NodeAvailability;
  allocated: number;
  selected: boolean;
  locale: Locale;
  dict: Dictionary;
  onAllocate: () => void;
  onRefund: () => void;
}) {
  const name = pick(node.name, locale);
  return (
    <button
      type="button"
      onClick={(e) => (e.shiftKey ? onRefund() : onAllocate())}
      onContextMenu={(e) => {
        e.preventDefault();
        onRefund();
      }}
      aria-label={`${name} ${t(dict.talents.rank, { current: allocated, max: node.maxPoints })}`}
      className={`relative aspect-square w-full max-w-11 rounded border-2 bg-[#0b0d10] transition-shadow focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ffd100] ${tileClasses(status)} ${selected ? "ring-2 ring-[#ffd100] ring-offset-1 ring-offset-[#0b0d10]" : ""}`}
    >
      {node.icon ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={`/icons/${node.icon}`}
          alt=""
          width={56}
          height={56}
          loading="lazy"
          draggable={false}
          className={`h-full w-full rounded-sm object-cover ${iconClasses(status)}`}
        />
      ) : (
        <span className={`flex h-full w-full items-center justify-center text-sm font-bold text-[#9ca3af] ${iconClasses(status)}`}>
          {name.slice(0, 1)}
        </span>
      )}
      <span
        className={`pointer-events-none absolute inset-x-0 -bottom-5 text-center text-[11px] font-semibold leading-none ${rankClasses(status)}`}
      >
        {status === "maxed" ? t(dict.talents.rank, { current: node.maxPoints, max: node.maxPoints }) : t(dict.talents.rank, { current: allocated, max: node.maxPoints })}
      </span>
    </button>
  );
}

function TalentTreePanel({
  tree,
  data,
  build,
  selectedId,
  onSelect,
  onAllocate,
  onRefund,
  onResetTree,
  locale,
  dict,
}: {
  tree: TalentTree;
  data: ClassTalents;
  build: BuildState;
  selectedId: string | null;
  onSelect: (id: string) => void;
  onAllocate: (id: string) => void;
  onRefund: (id: string) => void;
  onResetTree: (treeId: string) => void;
  locale: Locale;
  dict: Dictionary;
}) {
  const rows = useMemo(() => Math.max(...tree.nodes.map((n) => n.row)) + 1, [tree]);
  const spent = treePointsSpent(build, data, tree.id);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  return (
    <section
      aria-label={`${pick(tree.name, locale)} ${spent}`}
      className="rounded-md border border-[#2a2f3a] bg-gradient-to-b from-[#151a21] to-[#0d1015] p-2.5"
    >
      <header className="mb-3 flex items-baseline justify-between border-b border-[#2a2f3a] pb-1.5">
        <h2 className="text-sm font-semibold tracking-wide text-[#e8d9a8]">{pick(tree.name, locale)}</h2>
        <span className="flex items-baseline gap-2">
          {spent > 0 && (
            <button
              type="button"
              onClick={() => onResetTree(tree.id)}
              title={dict.talents.resetTree}
              aria-label={`${dict.talents.resetTree}: ${pick(tree.name, locale)}`}
              className="text-xs text-[#8b93a1] hover:text-[#d1d5db]"
            >
              ↺
            </button>
          )}
          <span className={`text-xs font-semibold ${spent > 0 ? "text-[#ffd100]" : "text-[#8b93a1]"}`}>{spent}</span>
        </span>
      </header>
      <div className="relative">
        <PrereqArrows tree={tree} rows={rows} points={build.points} />
        <div className="relative grid" style={{ gridTemplateColumns: `repeat(${GRID_COLS}, 1fr)`, gap: "0.4rem" }}>
          {Array.from({ length: rows }, (_, row) => row).flatMap((row) =>
            Array.from({ length: GRID_COLS }, (_, col) => {
              const node = tree.nodes.find((n) => n.row === row && n.col === col);
              if (!node) return <div key={`${row}-${col}`} className="aspect-square" />;
              const status = nodeAvailability(build, data, node.id);
              const allocated = build.points[node.id] ?? 0;
              const reqs = requirementText(node, data, build, locale, dict);
              return (
                <div key={node.id} className="relative mb-5" style={{ gridRow: row + 1, gridColumn: col + 1 }}>
                  <div
                    onMouseEnter={() => setHoveredId(node.id)}
                    onMouseLeave={() => setHoveredId((id) => (id === node.id ? null : id))}
                  >
                    <TalentTile
                      node={node}
                      status={status}
                      allocated={allocated}
                      selected={selectedId === node.id}
                      locale={locale}
                      dict={dict}
                      onAllocate={() => {
                        onSelect(node.id);
                        onAllocate(node.id);
                      }}
                      onRefund={() => onRefund(node.id)}
                    />
                  </div>
                  {/* In-game style hover tooltip, pointer devices only */}
                  {hoveredId === node.id && selectedId !== node.id && (
                    <div
                      role="tooltip"
                      className={`pointer-events-none absolute top-0 z-50 hidden w-60 rounded-md border border-[#8a6d1f] bg-[#0b0d10]/95 p-2.5 shadow-xl lg:block ${
                        col >= 2 ? "right-full mr-2" : "left-full ml-2"
                      }`}
                    >
                      <p className="font-semibold text-[#e8d9a8]">
                        {pick(node.name, locale)}
                        <span className="ml-1 font-normal text-[#8b93a1]">
                          {t(dict.talents.rank, { current: allocated, max: node.maxPoints })}
                        </span>
                      </p>
                      <p className="mt-1 text-xs leading-relaxed text-[#b6bcc8]">{pick(node.description, locale)}</p>
                      {reqs.length > 0 && (
                        <p className="mt-1 text-xs text-amber-300">{reqs.join("; ")}</p>
                      )}
                    </div>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
    </section>
  );
}

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [importText, setImportText] = useState("");

  /** Apply an encoded build string. Accepts a raw code or a full share URL. */
  function loadEncoded(raw: string): "ok" | "mismatch" | "invalid" {
    const code = raw.includes("b=")
      ? new URLSearchParams(raw.slice(raw.indexOf("?") + 1)).get("b") ?? raw
      : raw.trim();
    const decoded = decodeBuild(code);
    if (!decoded || decoded.state.classId !== data.classId) return "invalid";
    const violations = validateBuild(decoded.state, data);
    if (decoded.gameVersion !== data.gameVersion) {
      setBuild(violations.length === 0 ? decoded.state : emptyBuild(data.classId, decoded.state.level));
      return "mismatch";
    }
    if (violations.length === 0) {
      setBuild(decoded.state);
      return "ok";
    }
    return "invalid";
  }

  // Restore build from ?b= share param once on mount. Hydration from the URL;
  // cannot run during SSR, so the set-state-in-effect rule is disabled here.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get("b");
    if (raw) {
      const outcome = loadEncoded(raw);
      setNotice(outcome === "mismatch" ? dict.talents.versionMismatch : outcome === "invalid" ? dict.talents.invalidLink : null);
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
  const selected = selectedId ? findNode(data, selectedId) : null;
  const selectedReqs = selected
    ? requirementText(selected.node, data, build, locale, dict)
    : [];

  function onAllocate(nodeId: string) {
    setError(null);
    setNotice(null);
    const result = allocate(build, data, nodeId);
    if ("error" in result) {
      setError(dict.talents.errors[result.error as AllocError]);
    } else {
      setBuild(result.state);
    }
  }

  function onRefund(nodeId: string) {
    setError(null);
    setNotice(null);
    const result = refund(build, data, nodeId);
    if ("error" in result) {
      setError(dict.talents.errors[result.error as RefundError]);
    } else {
      setBuild(result.state);
    }
  }

  function onResetTree(treeId: string) {
    setError(null);
    setNotice(null);
    const tree = data.trees.find((tr) => tr.id === treeId);
    if (!tree) return;
    const points = { ...build.points };
    for (const node of tree.nodes) delete points[node.id];
    const next = { ...build, points };
    if (validateBuild(next, data).length === 0) {
      setBuild(next);
    } else {
      setError(dict.talents.errors["would-invalidate"]);
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
      setNotice(message);
      setError(null);
    } catch {
      setError(text);
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

  function copyCode() {
    copyText(encodeBuild(build, data.gameVersion), dict.talents.codeCopied);
  }

  function applyImport() {
    const outcome = loadEncoded(importText);
    setError(null);
    if (outcome === "invalid") setError(dict.talents.importInvalid);
    else setNotice(outcome === "mismatch" ? dict.talents.versionMismatch : dict.talents.importDone);
    if (outcome !== "invalid") {
      setShowImport(false);
      setImportText("");
    }
  }

  const mobileTree = data.trees.find((tr) => tr.id === activeTree) ?? data.trees[0];

  return (
    <div className="rounded-lg border border-[#2a2f3a] bg-[#0b0d12] p-3 text-[#d1d5db] sm:p-4">
      {/* Status bar */}
      <div className="mb-4 flex flex-wrap items-center gap-x-6 gap-y-2 rounded-md border border-[#2a2f3a] bg-[#12161d] p-3">
        <div className="text-sm">
          <label htmlFor="sim-level" className="mr-2 font-medium text-[#e8d9a8]">
            {dict.talents.level}: {build.level}
          </label>
          <input
            id="sim-level"
            type="range"
            min={1}
            max={data.rules.maxLevel}
            value={build.level}
            onChange={(e) => onLevelChange(Number(e.target.value))}
            className="w-40 align-middle accent-[#ffd100]"
          />
        </div>
        <div className="text-sm">
          <span className={overSpent ? "font-semibold text-red-400" : "font-medium text-[#9ae89f]"}>
            {dict.talents.pointsRemaining}: {Math.max(0, available - spent)}
          </span>
          <span className="ml-3 text-[#8b93a1]">
            {dict.talents.pointsSpent}: {spent}/{available}
          </span>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => { setBuild(resetBuild(build)); setError(null); }}
            className="rounded border border-[#3a4150] px-3 py-1.5 text-sm text-[#d1d5db] hover:bg-[#1c222c]"
          >
            {dict.talents.reset}
          </button>
          <button
            type="button"
            onClick={copyLink}
            className="rounded border border-[#8a6d1f] bg-[#2a2210] px-3 py-1.5 text-sm font-medium text-[#ffd100] hover:bg-[#3a2f14]"
          >
            {dict.talents.share}
          </button>
          <button
            type="button"
            onClick={copySummary}
            className="rounded border border-[#3a4150] px-3 py-1.5 text-sm text-[#d1d5db] hover:bg-[#1c222c]"
          >
            {dict.common.actions.copySummary}
          </button>
          <button
            type="button"
            onClick={copyCode}
            className="rounded border border-[#3a4150] px-3 py-1.5 text-sm text-[#d1d5db] hover:bg-[#1c222c]"
          >
            {dict.talents.copyCode}
          </button>
          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            aria-expanded={showImport}
            className="rounded border border-[#3a4150] px-3 py-1.5 text-sm text-[#d1d5db] hover:bg-[#1c222c]"
          >
            {dict.talents.import}
          </button>
        </div>
      </div>

      {showImport && (
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-md border border-[#2a2f3a] bg-[#12161d] p-3">
          <input
            type="text"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && applyImport()}
            placeholder={dict.talents.importPlaceholder}
            aria-label={dict.talents.import}
            className="min-w-0 flex-1 rounded border border-[#3a4150] bg-[#0b0d10] px-3 py-1.5 font-mono text-sm text-[#d1d5db] placeholder:text-[#8b93a1]"
          />
          <button
            type="button"
            onClick={applyImport}
            className="rounded border border-[#8a6d1f] bg-[#2a2210] px-3 py-1.5 text-sm font-medium text-[#ffd100] hover:bg-[#3a2f14]"
          >
            {dict.common.actions.apply}
          </button>
        </div>
      )}

      <p className="mb-3 text-xs text-[#8b93a1]">{dict.talents.hints}</p>

      {overSpent && (
        <p role="alert" className="mb-3 rounded-md border border-red-800 bg-red-950/60 p-3 text-sm text-red-300">
          {dict.talents.errors["no-points"]}
        </p>
      )}
      {error && (
        <p role="alert" className="mb-3 rounded-md border border-red-800 bg-red-950/60 p-3 text-sm text-red-300">
          {error}
        </p>
      )}
      {notice && !error && (
        <p role="status" className="mb-3 rounded-md border border-blue-800 bg-blue-950/60 p-3 text-sm text-blue-300">
          {notice}
        </p>
      )}

      {/* Tree tabs on small screens; all three columns on lg+ */}
      <div className="mb-3 flex gap-1 overflow-x-auto lg:hidden" role="tablist" aria-label={dict.talents.tree}>
        {data.trees.map((tr) => {
          const treeSpent = treePointsSpent(build, data, tr.id);
          const active = tr.id === activeTree;
          return (
            <button
              key={tr.id}
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTree(tr.id)}
              className={`whitespace-nowrap rounded-t-md border-b-2 px-4 py-2 text-sm font-medium ${
                active
                  ? "border-[#ffd100] text-[#ffd100]"
                  : "border-transparent text-[#8b93a1] hover:text-[#d1d5db]"
              }`}
            >
              {pick(tr.name, locale)} ({treeSpent})
            </button>
          );
        })}
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* Mobile: single tree. Desktop: all three side by side. */}
        <div className="lg:hidden">
          <TalentTreePanel
            tree={mobileTree}
            data={data}
            build={build}
            selectedId={selectedId}
            onSelect={setSelectedId}
            onAllocate={onAllocate}
            onRefund={onRefund}
            onResetTree={onResetTree}
            locale={locale}
            dict={dict}
          />
        </div>
        {data.trees.map((tr) => (
          <div key={tr.id} className="hidden lg:block">
            <TalentTreePanel
              tree={tr}
              data={data}
              build={build}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onAllocate={onAllocate}
              onRefund={onRefund}
              onResetTree={onResetTree}
              locale={locale}
              dict={dict}
            />
          </div>
        ))}
      </div>

      {/* Selected node detail panel (tooltip equivalent, mobile friendly) */}
      {selected && (
        <div className="mt-4 rounded-md border border-[#8a6d1f]/50 bg-[#15181f] p-3">
          <div className="flex flex-wrap items-center gap-3">
            {selected.node.icon && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`/icons/${selected.node.icon}`} alt="" width={40} height={40} className="h-10 w-10 rounded border border-[#3a4150]" />
            )}
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-[#e8d9a8]">
                {pick(selected.node.name, locale)}{" "}
                <span className="text-sm font-normal text-[#8b93a1]">
                  {t(dict.talents.rank, { current: build.points[selected.node.id] ?? 0, max: selected.node.maxPoints })}
                </span>
              </p>
              <p className="mt-0.5 text-sm text-[#b6bcc8]">{pick(selected.node.description, locale)}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => onAllocate(selected.node.id)}
                className="rounded border border-[#1eff00]/50 bg-[#0f2410] px-3 py-1.5 text-sm font-medium text-[#9ae89f] hover:bg-[#16331a]"
              >
                +1
              </button>
              <button
                type="button"
                onClick={() => onRefund(selected.node.id)}
                aria-label={`Refund ${pick(selected.node.name, locale)}`}
                disabled={(build.points[selected.node.id] ?? 0) === 0}
                className="rounded border border-[#3a4150] px-3 py-1.5 text-sm text-[#d1d5db] hover:bg-[#1c222c] disabled:opacity-40"
              >
                −1
              </button>
            </div>
          </div>
          {selectedReqs.length > 0 && (
            <p className="mt-2 text-sm text-amber-300">
              {dict.talents.lockedNode}: {selectedReqs.join("; ")}
            </p>
          )}
          {selected.node.exclusiveWith.length > 0 && (
            <p className="mt-1 text-xs text-[#8b93a1]">
              {dict.talents.exclusive}: {selected.node.exclusiveWith.map((id) => {
                const found = findNode(data, id);
                return found ? pick(found.node.name, locale) : id;
              }).join(", ")}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
