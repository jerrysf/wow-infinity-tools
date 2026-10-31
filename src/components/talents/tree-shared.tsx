import type { TalentTree } from "@/lib/data/schema";
import type { NodeAvailability } from "@/lib/talents/engine";

export const GRID_COLS = 4;

/** WoW-style tile visuals: grayscale + dim border when locked, green when
 *  learnable/allocated, gold when maxed. */
export function tileClasses(status: NodeAvailability): string {
  switch (status) {
    case "maxed":
      return "border-[#ffd100] shadow-[0_0_6px_rgba(255,209,0,0.45)]";
    case "allocated":
      return "border-[#1eff00] shadow-[0_0_5px_rgba(30,255,0,0.3)]";
    case "available":
      return "border-[#1eff00]/70 hover:shadow-[0_0_6px_rgba(30,255,0,0.5)]";
    default:
      return "border-[#3a3f45]";
  }
}

export function iconClasses(status: NodeAvailability): string {
  return status.startsWith("locked") ? "grayscale opacity-50" : "";
}

export function rankClasses(status: NodeAvailability): string {
  if (status === "maxed") return "text-[#ffd100]";
  if (status === "allocated") return "text-[#1eff00]";
  if (status === "available") return "text-[#9ae89f]";
  return "text-[#6b7280]";
}

/** Elbow connector from a prerequisite tile to its dependent, classic style:
 *  down from the parent's bottom edge, across, into the child's top edge. */
export function PrereqArrows({
  tree,
  rows,
  points,
}: {
  tree: TalentTree;
  rows: number;
  points: Record<string, number>;
}) {
  const paths: { id: string; d: string; active: boolean }[] = [];
  for (const node of tree.nodes) {
    for (const req of node.requires) {
      const parent = tree.nodes.find((n) => n.id === req.nodeId);
      if (!parent) continue;
      const px = ((parent.col + 0.5) / GRID_COLS) * 100;
      const py = ((parent.row + 1) / rows) * 100;
      const cx = ((node.col + 0.5) / GRID_COLS) * 100;
      const cy = (node.row / rows) * 100;
      const d =
        px === cx
          ? `M ${px} ${py} L ${cx} ${cy}`
          : `M ${px} ${py} L ${px} ${cy} L ${cx} ${cy}`;
      const needed = req.points ?? parent.maxPoints;
      paths.push({ id: `${req.nodeId}->${node.id}`, d, active: (points[req.nodeId] ?? 0) >= needed });
    }
  }
  return (
    <svg
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      className="pointer-events-none absolute inset-0 h-full w-full"
      aria-hidden="true"
    >
      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          vectorEffect="non-scaling-stroke"
          strokeWidth={2.5}
          stroke={p.active ? "#ffd100" : "#4b5563"}
          strokeLinecap="square"
        />
      ))}
    </svg>
  );
}
