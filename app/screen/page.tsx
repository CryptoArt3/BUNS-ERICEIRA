"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type FallbackSlide = {
  id: string;
  title: string[];
  subtitle: string;
  lines: string[];
};

type BackendSlide = {
  id?: string | null;
  title?: string | null;
  subtitle?: string | null;
  lines?: string[] | null;
};

type ScreenApiResponse = {
  ok?: boolean;
  slide_type?: string | null;
  slide?: BackendSlide | null;
  updated_at?: string | null;
};

type DisplaySlide = {
  id: string;
  titleLines: string[];
  subtitle: string;
  lines: string[];
};

const FALLBACK_SLIDES: FallbackSlide[] = [
  {
    id: "fallback-buns-adventures",
    title: ["BUNS", "ADVENTURES"],
    subtitle: "Buns & Bunana",
    lines: [],
  },
  {
    id: "fallback-smash-burgers",
    title: ["SMASH", "BURGERS"],
    subtitle: "Made in Ericeira",
    lines: [],
  },
  {
    id: "fallback-google-rating",
    title: ["4.9★", "GOOGLE"],
    subtitle: "212 REVIEWS",
    lines: [],
  },
  {
    id: "fallback-kids-menu",
    title: ["KIDS", "MENU"],
    subtitle: "TOY INCLUDED",
    lines: [],
  },
];

const AGENT_API_BASE_URL = process.env.NEXT_PUBLIC_AGENT_API_BASE_URL?.replace(/\/+$/, "");
const BACKEND_ENDPOINT = AGENT_API_BASE_URL
  ? `${AGENT_API_BASE_URL}/screen/next`
  : null;
const FALLBACK_SLIDE_DURATION_MS = 7000;
const POLL_INTERVAL_MS = 10_000;
const BACKGROUND_VIDEO_SRC: string | null = null;

export default function ScreenPage() {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [liveSlide, setLiveSlide] = useState<DisplaySlide | null>(null);
  const [liveSlideKey, setLiveSlideKey] = useState<string | null>(null);
  const liveSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (liveSlide) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % FALLBACK_SLIDES.length);
    }, FALLBACK_SLIDE_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [index, liveSlide]);

  useEffect(() => {
    let isMounted = true;

    const applyFallback = () => {
      if (!isMounted) {
        return;
      }

      liveSignatureRef.current = null;
      setLiveSlide(null);
      setLiveSlideKey(null);
    };

    const fetchNextSlide = async () => {
      try {
        if (!BACKEND_ENDPOINT) {
          applyFallback();
          return;
        }

        const response = await fetch(BACKEND_ENDPOINT, {
          cache: "no-store",
        });

        if (!response.ok) {
          applyFallback();
          return;
        }

        const payload = (await response.json()) as ScreenApiResponse;

        if (payload.slide_type == null || !payload.slide) {
          applyFallback();
          return;
        }

        const normalized = normalizeBackendSlide(payload);

        if (!normalized) {
          applyFallback();
          return;
        }

        const signature = JSON.stringify({
          slideType: payload.slide_type,
          updatedAt: payload.updated_at ?? null,
          slide: normalized,
        });

        if (!isMounted) {
          return;
        }

        if (liveSignatureRef.current !== signature) {
          liveSignatureRef.current = signature;
          setLiveSlide(normalized);
          setLiveSlideKey(
            `${payload.slide_type}:${payload.updated_at ?? "current"}:${normalized.id}`
          );
        }
      } catch {
        applyFallback();
      }
    };

    void fetchNextSlide();
    const interval = window.setInterval(() => {
      void fetchNextSlide();
    }, POLL_INTERVAL_MS);

    return () => {
      isMounted = false;
      window.clearInterval(interval);
    };
  }, []);

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

  const fallbackSlide = FALLBACK_SLIDES[index];
  const currentSlide = liveSlide ?? toDisplaySlide(fallbackSlide);
  const slideKey = liveSlide ? liveSlideKey ?? liveSlide.id : `fallback-${fallbackSlide.id}`;
  const statusLabel = wakeLockActive || isFullscreen ? "Running" : "Starting";
  const sourceLabel = liveSlide ? "Live" : `Slide ${index + 1}/${FALLBACK_SLIDES.length}`;
  const detailLines = useMemo(
    () => currentSlide.lines.filter((line) => line.trim().length > 0),
    [currentSlide.lines]
  );

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
        <span>{sourceLabel}</span>
        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgba(74,222,128,0.9)]" />
        <span>{statusLabel}</span>
      </div>

      <section className="relative z-10 mx-auto flex min-h-dvh w-full max-w-[42rem] items-center justify-center px-7 py-24 sm:px-10 sm:py-28">
        <AnimatePresence mode="wait">
          <motion.div
            key={slideKey}
            initial={{ opacity: 0, scale: 0.965 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.03 }}
            transition={{ duration: 0.9, ease: "easeInOut" }}
            className="flex w-full flex-col items-center justify-center gap-14 sm:gap-20"
          >
            <div className="flex min-h-[42dvh] w-full flex-col items-center justify-center gap-6">
              <motion.h1
                initial={{ opacity: 0, scale: 0.975 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className="flex flex-col items-center gap-2 font-display text-[clamp(5.25rem,15vw,8.75rem)] font-bold uppercase leading-[0.88] tracking-[0.06em] 2xl:text-[10rem]"
              >
                {currentSlide.titleLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </motion.h1>
            </div>

            <div className="flex flex-col items-center gap-8">
              <motion.p
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.08, ease: "easeOut" }}
                className="max-w-[28rem] font-body text-[clamp(1.6rem,4.6vw,3rem)] uppercase leading-[1.15] tracking-[0.28em] text-white/72 2xl:text-[3.25rem]"
              >
                {currentSlide.subtitle}
              </motion.p>

              {detailLines.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                  className="flex max-w-[34rem] flex-col items-center gap-3"
                >
                  {detailLines.map((line) => (
                    <p
                      key={line}
                      className="font-body text-[clamp(1rem,2.1vw,1.35rem)] uppercase tracking-[0.22em] text-white/58"
                    >
                      {line}
                    </p>
                  ))}
                </motion.div>
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}

function normalizeBackendSlide(payload: ScreenApiResponse): DisplaySlide | null {
  const title = payload.slide?.title?.trim();
  const subtitle = payload.slide?.subtitle?.trim();

  if (!title || !subtitle) {
    return null;
  }

  return {
    id: payload.slide?.id?.trim() || payload.updated_at || "backend-slide",
    titleLines: splitTitleLines(title),
    subtitle,
    lines: Array.isArray(payload.slide?.lines)
      ? payload.slide.lines
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
      : [],
  };
}

function splitTitleLines(title: string) {
  const explicitLines = title
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  if (explicitLines.length > 1) {
    return explicitLines;
  }

  return [title];
}

function toDisplaySlide(slide: FallbackSlide): DisplaySlide {
  return {
    id: slide.id,
    titleLines: slide.title,
    subtitle: slide.subtitle,
    lines: slide.lines,
  };
}
