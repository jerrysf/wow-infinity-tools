"use client";

import { useState } from "react";
import type { Dictionary } from "@/i18n/dictionaries/zh-cn";

export function CopyLinkButton({ dict }: { dict: Dictionary }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  }

  return (
    <button type="button" onClick={copy} className="btn-ghost">
      {copied ? dict.common.actions.copied : dict.common.actions.copyLink}
    </button>
  );
}
