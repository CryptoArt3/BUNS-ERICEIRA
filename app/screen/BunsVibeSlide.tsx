"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type VibeMediaItem = {
  id: string;
  src: string;
  type: "image" | "video";
  durationMs: number;
};

const VIBE_MEDIA: VibeMediaItem[] = [
  {
    id: "vibe-01-video",
    src: "/vibe/vibe-01.mp4",
    type: "video",
    durationMs: 10000,
  },
  {
    id: "vibe-01-image",
    src: "/vibe/vibe-01.jpg",
    type: "image",
    durationMs: 7000,
  },
  {
    id: "vibe-02-image",
    src: "/vibe/vibe-02.jpg",
    type: "image",
    durationMs: 7000,
  },
  {
    id: "vibe-03-image",
    src: "/vibe/vibe-03.jpg",
    type: "image",
    durationMs: 7000,
  },
];

export default function BunsVibeSlide() {
  const [index, setIndex] = useState(0);

  const currentMedia = useMemo(
    () => VIBE_MEDIA[index] ?? VIBE_MEDIA[0],
    [index]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIndex((current) => (current + 1) % VIBE_MEDIA.length);
    }, currentMedia.durationMs);

    return () => window.clearTimeout(timeout);
  }, [currentMedia.durationMs]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#050404] text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMedia.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {currentMedia.type === "video" ? (
            <video
              src={currentMedia.src}
              autoPlay
              muted
              loop
              playsInline
              className="h-full w-full object-cover"
            />
          ) : (
            <img
              src={currentMedia.src}
              alt="BUNS vibe"
              className="h-full w-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.2),rgba(0,0,0,0.48)_58%,rgba(0,0,0,0.72))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,209,102,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(0,240,255,0.08),transparent_32%)]" />

      <div className="absolute inset-x-0 bottom-0 z-10 px-8 py-10 sm:px-12 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-[52rem] flex-col items-center gap-3 text-center"
        >
          <span className="font-display text-[clamp(3rem,9vw,6.5rem)] font-black uppercase leading-[0.88] tracking-[0.08em] text-[#ffd166] [text-shadow:0_0_45px_rgba(255,209,102,0.45),0_8px_28px_rgba(0,0,0,0.8)]">
            BUNS ERICEIRA
          </span>
          <span className="font-body text-[clamp(0.8rem,2vw,1.15rem)] font-semibold uppercase tracking-[0.42em] text-white/85">
            SMASH BURGERS • ERICEIRA
          </span>
        </motion.div>
      </div>
    </div>
  );
}
