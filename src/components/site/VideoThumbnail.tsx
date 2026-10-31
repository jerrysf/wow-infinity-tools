"use client";

import Image from "next/image";
import { useState } from "react";

export function VideoThumbnail({ videoId, alt }: { videoId: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-[#2b2418] to-[#14100a] text-4xl text-[#8a6a28]">
        ▶
      </div>
    );
  }

  return (
    <Image
      src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
      alt={alt}
      width={480}
      height={270}
      className="aspect-video w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
