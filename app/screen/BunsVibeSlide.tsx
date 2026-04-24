"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

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

const VIBE_COPY = [
  "SMASH BURGERS",
  "ERICEIRA VIBES",
  "MADE TO CRAVE",
  "FRESH OFF THE GRILL",
  "NO FREEZERS. JUST FIRE.",
];

export default function BunsVibeSlide() {
  const [index, setIndex] = useState(0);
  const timeoutRef = useRef<number | null>(null);

  const currentMedia = useMemo(
    () => VIBE_MEDIA[index] ?? VIBE_MEDIA[0],
    [index]
  );
  const currentCopy = useMemo(
    () => VIBE_COPY[index % VIBE_COPY.length],
    [index]
  );

  const advanceMedia = useCallback(() => {
    setIndex((current) => (current + 1) % VIBE_MEDIA.length);
  }, []);

  useEffect(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = window.setTimeout(() => {
      advanceMedia();
    }, currentMedia.durationMs);

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, [advanceMedia, currentMedia.durationMs, currentMedia.id]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#050404] text-white">
      <AnimatePresence mode="wait">
        <motion.div
          key={currentMedia.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {currentMedia.type === "video" ? (
            <motion.video
              key={currentMedia.id}
              src={currentMedia.src}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onEnded={advanceMedia}
              initial={{ scale: 1.02 }}
              animate={{ scale: 1.08 }}
              transition={{ duration: currentMedia.durationMs / 1000, ease: "linear" }}
              className="h-full w-full object-cover"
            />
          ) : (
            <motion.img
              src={currentMedia.src}
              alt="BUNS vibe"
              initial={{ scale: 1.02 }}
              animate={{ scale: 1.08 }}
              transition={{ duration: currentMedia.durationMs / 1000, ease: "linear" }}
              className="h-full w-full object-cover"
            />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.16),rgba(0,0,0,0.38)_40%,rgba(0,0,0,0.58)_68%,rgba(0,0,0,0.82))]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,209,102,0.22),transparent_28%),radial-gradient(circle_at_bottom,rgba(0,240,255,0.1),transparent_34%),linear-gradient(90deg,rgba(0,0,0,0.22),transparent_30%,transparent_70%,rgba(0,0,0,0.22))]" />

      <div className="absolute left-6 top-6 z-10 sm:left-10 sm:top-10">
        <div className="rounded-full border border-[#ffd166]/40 bg-black/45 px-4 py-2 backdrop-blur-sm">
          <span className="font-body text-[0.7rem] font-black uppercase tracking-[0.34em] text-[#ffd166]">
            BUNS MODE
          </span>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 z-10 px-8 py-10 sm:px-12 sm:py-14">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="mx-auto flex w-full max-w-[56rem] flex-col items-center gap-4 text-center"
        >
          <AnimatePresence mode="wait">
            <motion.span
              key={currentCopy}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="font-body text-[clamp(0.75rem,1.9vw,1.05rem)] font-black uppercase tracking-[0.46em] text-white/80"
            >
              {currentCopy}
            </motion.span>
          </AnimatePresence>
          <span className="font-display text-[clamp(3rem,9vw,6.5rem)] font-black uppercase leading-[0.88] tracking-[0.08em] text-[#ffd166] [text-shadow:0_0_45px_rgba(255,209,102,0.45),0_8px_28px_rgba(0,0,0,0.8)]">
            BUNS ERICEIRA
          </span>
          <span className="font-body text-[clamp(0.8rem,2vw,1.15rem)] font-semibold uppercase tracking-[0.42em] text-white/88">
            SMASH BURGERS • ERICEIRA
          </span>
        </motion.div>
      </div>
    </div>
  );
}
