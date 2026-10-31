"use client";

import { useEffect } from "react";

const ENABLED = process.env.NEXT_PUBLIC_ADS_ENABLED === "true";
const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * AdSense slot. Renders nothing unless NEXT_PUBLIC_ADS_ENABLED=true and a
 * client ID is configured. The adsbygoogle loader script is emitted once in
 * the locale layout under the same condition.
 */
export function AdSlot({ id }: { id: string }) {
  useEffect(() => {
    if (!ENABLED || !CLIENT) return;
    try {
      (window.adsbygoogle = window.adsbygoogle ?? []).push({});
    } catch {
      // Ad blockers and script load failures must not break the page.
    }
  }, []);

  if (!ENABLED || !CLIENT) return null;
  return (
    <div className="my-6 min-h-24" data-ad-slot={id}>
      <ins
        className="adsbygoogle"
        style={{ display: "block" }}
        data-ad-client={CLIENT}
        data-ad-slot={id}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
