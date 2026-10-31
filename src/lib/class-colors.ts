/** Official WoW class colours, used to give class names their in-game colour. */
export const CLASS_COLORS: Record<string, string> = {
  druid: "#FF7C0A",
  hunter: "#AAD372",
  mage: "#3FC7EB",
  paladin: "#F48CBA",
  priest: "#F4E9D0",
  rogue: "#FFF468",
  shaman: "#4F8FF7",
  warlock: "#9382C9",
  warrior: "#C69B6D",
};

export function classColor(id: string): string {
  return CLASS_COLORS[id] ?? "#e6edf5";
}
