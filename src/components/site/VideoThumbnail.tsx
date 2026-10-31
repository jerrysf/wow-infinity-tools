"use client";

import Image from "next/image";
import { useState } from "react";

export function VideoThumbnail({ videoId, alt }: { videoId: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-video w-full items-center justify-center bg-gradient-to-br from-[#1a2433] to-[#0c1219] text-4xl text-[#c99632]">
        ▶
      </div>
    );
  }

  return (
    <Image
      src={`/thumbs/${videoId}.jpg`}
      alt={alt}
      width={480}
      height={270}
      className="aspect-video w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}
