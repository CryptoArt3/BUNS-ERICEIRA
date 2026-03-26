"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";

type DisplaySlide = {
  id: string;
  titleLines: string[];
  subtitle: string;
  lines: string[];
  image: string | null;
  durationMs: number;
  type: string | null;
};

type ScreenApiSlide = {
  type?: string | null;
  product_slug?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  cta?: string | null;
  image?: string | null;
  duration?: number | null;
};

type ScreenApiResponse = {
  ok?: boolean;
  status?: string | null;
  slides?: ScreenApiSlide[] | null;
  updated_at?: string | null;
};

const FALLBACK_SLIDES: DisplaySlide[] = [
  {
    id: "fallback-buns-adventures",
    titleLines: ["BUNS", "ADVENTURES"],
    subtitle: "Buns & Bunana",
    lines: [],
    image: null,
    durationMs: 7000,
    type: null,
  },
  {
    id: "fallback-smash-burgers",
    titleLines: ["SMASH", "BURGERS"],
    subtitle: "Made in Ericeira",
    lines: [],
    image: null,
    durationMs: 7000,
    type: null,
  },
  {
    id: "fallback-google-rating",
    titleLines: ["4.9*", "GOOGLE"],
    subtitle: "212 REVIEWS",
    lines: [],
    image: null,
    durationMs: 7000,
    type: null,
  },
  {
    id: "fallback-kids-menu",
    titleLines: ["KIDS", "MENU"],
    subtitle: "TOY INCLUDED",
    lines: [],
    image: null,
    durationMs: 7000,
    type: null,
  },
];

const AGENT_API_BASE_URL = process.env.NEXT_PUBLIC_AGENT_API_BASE_URL?.replace(/\/+$/, "") ?? "";
const SCREEN_PLAYLIST_URL = AGENT_API_BASE_URL ? `${AGENT_API_BASE_URL}/webdev/screen` : null;
const FALLBACK_SLIDE_DURATION_MS = 7000;
const POLL_INTERVAL_MS = 15000;
const MIN_LIVE_DURATION_MS = 4000;

export default function ScreenClient() {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [liveSlides, setLiveSlides] = useState<DisplaySlide[] | null>(null);
  const liveSignatureRef = useRef<string | null>(null);

  const activeSlides = liveSlides && liveSlides.length > 0 ? liveSlides : FALLBACK_SLIDES;
  const isLive = Boolean(liveSlides && liveSlides.length > 0);
  const currentSlide = activeSlides[index] ?? activeSlides[0];
  const slideDurationMs = currentSlide?.durationMs ?? FALLBACK_SLIDE_DURATION_MS;

  useEffect(() => {
    setIndex((current) => (current >= activeSlides.length ? 0 : current));
  }, [activeSlides.length]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % activeSlides.length);
    }, slideDurationMs);

    return () => window.clearTimeout(timeout);
  }, [activeSlides.length, index, slideDurationMs]);

  useEffect(() => {
    let isMounted = true;

    console.log("[screen] api_base_url", AGENT_API_BASE_URL || "(empty)");
    console.log("[screen] fetch_target", SCREEN_PLAYLIST_URL || "(none)");

    const applyFallback = (reason: string) => {
      console.warn("[screen] using fallback", reason);

      if (!isMounted) {
        return;
      }

      liveSignatureRef.current = null;
      setLiveSlides(null);
    };

    const loadScreen = async () => {
      if (!SCREEN_PLAYLIST_URL) {
        applyFallback("missing NEXT_PUBLIC_AGENT_API_BASE_URL");
        return;
      }

      try {
        const response = await fetch(SCREEN_PLAYLIST_URL, {
          cache: "no-store",
        });

        if (!response.ok) {
          console.warn("[screen] fetch_non_ok", response.status);
          applyFallback(`http_${response.status}`);
          return;
        }

        const payload = (await response.json()) as ScreenApiResponse;
        console.log("[screen] payload_status", payload.status ?? "(missing)");
        console.log(
          "[screen] payload_slides",
          Array.isArray(payload.slides) ? payload.slides.length : 0
        );

        const normalizedSlides = normalizeLiveSlides(payload);

        if (!isMounted) {
          return;
        }

        if (!normalizedSlides) {
          applyFallback(`status_${payload.status ?? "unknown"}`);
          return;
        }

        const signature = JSON.stringify({
          updatedAt: payload.updated_at ?? null,
          slides: normalizedSlides,
        });

        if (liveSignatureRef.current === signature) {
          console.log("[screen] payload unchanged");
          return;
        }

        console.log("[screen] applying live slides", normalizedSlides.length);
        liveSignatureRef.current = signature;
        setLiveSlides(normalizedSlides);
        setIndex(0);
      } catch (error) {
        console.error("[screen] fetch_error", error);
        applyFallback("fetch_exception");
      }
    };

    void loadScreen();
    const interval = window.setInterval(() => {
      void loadScreen();
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

  const slideKey = `${currentSlide.id}-${index}`;
  const statusLabel = wakeLockActive || isFullscreen ? "Running" : "Starting";
  const sourceLabel = isLive
    ? `Live ${index + 1}/${activeSlides.length}`
    : `Fallback ${index + 1}/${FALLBACK_SLIDES.length}`;
  const detailLines = useMemo(
    () => currentSlide.lines.filter((line) => line.trim().length > 0),
    [currentSlide.lines]
  );

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-black px-6 py-8 text-center text-white">
      {currentSlide.image ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url("${currentSlide.image}")` }}
        />
      ) : null}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%),linear-gradient(180deg,rgba(0,0,0,0.68),rgba(0,0,0,0.92))]" />

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
              {currentSlide.type ? (
                <p className="rounded-full border border-white/12 bg-white/6 px-4 py-2 font-body text-xs uppercase tracking-[0.34em] text-white/55">
                  {currentSlide.type}
                </p>
              ) : null}

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

function normalizeLiveSlides(payload: ScreenApiResponse): DisplaySlide[] | null {
  if (payload.status !== "live" || !Array.isArray(payload.slides) || payload.slides.length === 0) {
    return null;
  }

  const slides = payload.slides
    .map((slide, index) => normalizeLiveSlide(slide, index))
    .filter((slide): slide is DisplaySlide => slide !== null);

  return slides.length > 0 ? slides : null;
}

function normalizeLiveSlide(slide: ScreenApiSlide, index: number): DisplaySlide | null {
  const headline = slide.headline?.trim();
  const subheadline = slide.subheadline?.trim();

  if (!headline || !subheadline) {
    return null;
  }

  return {
    id: slide.product_slug?.trim() || `${slide.type ?? "screen"}-${index + 1}`,
    titleLines: splitTitleLines(headline),
    subtitle: subheadline,
    lines: slide.cta?.trim() ? [slide.cta.trim()] : [],
    image: slide.image?.trim() || null,
    durationMs: normalizeDurationMs(slide.duration),
    type: slide.type?.trim() || null,
  };
}

function normalizeDurationMs(durationSeconds: number | null | undefined) {
  if (typeof durationSeconds !== "number" || !Number.isFinite(durationSeconds)) {
    return FALLBACK_SLIDE_DURATION_MS;
  }

  return Math.max(MIN_LIVE_DURATION_MS, Math.round(durationSeconds * 1000));
}

function splitTitleLines(title: string) {
  const explicitLines = title
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return explicitLines.length > 0 ? explicitLines : [title];
}
