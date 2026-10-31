/**
 * Monetisation placeholder. Renders nothing unless ads are explicitly enabled
 * via NEXT_PUBLIC_ADS_ENABLED at launch. Kept as a named slot so ad wiring
 * later does not touch page layouts.
 */
export function AdSlot({ id }: { id: string }) {
  if (process.env.NEXT_PUBLIC_ADS_ENABLED !== "true") return null;
  return (
    <div
      data-ad-slot={id}
      className="my-6 flex min-h-24 items-center justify-center rounded border border-dashed border-zinc-300 text-xs text-[#7a6a4a] dark:border-[#3a2c17]"
    >
      Advertisement
    </div>
  );
}
