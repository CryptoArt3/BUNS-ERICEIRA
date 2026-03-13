"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";

const slides = [
  {
    title: ["BUNS", "ADVENTURES"],
    subtitle: "Buns & Bunana",
  },
  {
    title: ["SMASH", "BURGERS"],
    subtitle: "Made in Ericeira",
  },
  {
    title: ["4.9★", "GOOGLE"],
    subtitle: "212 REVIEWS",
  },
  {
    title: ["KIDS", "MENU"],
    subtitle: "TOY INCLUDED",
  },
];

const SLIDE_DURATION_MS = 7000;
const BACKGROUND_VIDEO_SRC: string | null = null;

export default function ScreenPage() {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % slides.length);
    }, SLIDE_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [index]);

  useEffect(() => {
    let wakeLock: { release?: () => Promise<void> } | null = null;

    const requestWakeLock = async () => {
      try {
        const sentinel = await (navigator as Navigator & {
          wakeLock?: {
            request: (type: "screen") => Promise<{ release?: () => Promise<void> }>;
          };
        }).wakeLock?.request("screen");

        wakeLock = sentinel ?? null;
        setWakeLockActive(Boolean(sentinel));
      } catch {
        setWakeLockActive(false);
      }
    };

    const requestFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch {
        // Fullscreen requests can be rejected without a user gesture.
      } finally {
        setIsFullscreen(Boolean(document.fullscreenElement));
      }
    };

    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        void requestWakeLock();
        void requestFullscreen();
      }
    };

    const preventDefault = (event: Event) => {
      event.preventDefault();
    };

    const preventKeyboard = (event: KeyboardEvent) => {
      event.preventDefault();
      event.stopPropagation();
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overscrollBehavior = "none";
    document.documentElement.style.touchAction = "none";
    document.body.style.touchAction = "none";

    void requestWakeLock();
    void requestFullscreen();

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    document.addEventListener("contextmenu", preventDefault);
    document.addEventListener("keydown", preventKeyboard, true);
    window.addEventListener("wheel", preventDefault, { passive: false });
    window.addEventListener("touchmove", preventDefault, { passive: false });

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.documentElement.style.overscrollBehavior = "";
      document.body.style.overscrollBehavior = "";
      document.documentElement.style.touchAction = "";
      document.body.style.touchAction = "";
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      document.removeEventListener("contextmenu", preventDefault);
      document.removeEventListener("keydown", preventKeyboard, true);
      window.removeEventListener("wheel", preventDefault);
      window.removeEventListener("touchmove", preventDefault);

      if (wakeLock?.release) {
        void wakeLock.release();
      }
    };
  }, []);

  const slide = slides[index];

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-black px-6 py-8 text-center text-white">
      {BACKGROUND_VIDEO_SRC ? (
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover opacity-20"
          src={BACKGROUND_VIDEO_SRC}
        />
      ) : null}
      <div className="absolute inset-0 bg-black/75" />

      <div className="absolute right-4 top-4 z-10 flex items-center gap-3 rounded-full border border-white/15 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/80 backdrop-blur-sm sm:right-6 sm:top-6">
        <span>
          Slide {index + 1}/{slides.length}
        </span>
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
        <span>
          {wakeLockActive || isFullscreen ? "Running" : "Starting"}
        </span>
      </div>

      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[42rem] items-center justify-center px-7 py-24 sm:px-10 sm:py-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, scale: 0.965 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="flex w-full flex-col items-center justify-center gap-24"
          >
            <div className="flex min-h-[46dvh] w-full flex-col items-center justify-center gap-6">
              <motion.h1
                initial={{ opacity: 0, scale: 0.975 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="flex flex-col items-center gap-2 font-display text-[clamp(5.25rem,15vw,8.75rem)] font-bold uppercase leading-[0.88] tracking-[0.06em] 2xl:text-[10rem]"
              >
                {slide.title.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </motion.h1>
            </div>
            <motion.p
              initial={{ opacity: 0, scale: 0.985 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1.2, delay: 0.08, ease: "easeOut" }}
              className="max-w-[24rem] font-body text-[clamp(1.6rem,4.6vw,3rem)] uppercase leading-[1.15] tracking-[0.28em] text-white/72 2xl:text-[3.25rem]"
            >
              {slide.subtitle}
            </motion.p>
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}