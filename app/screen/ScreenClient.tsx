"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useRef, useState } from "react";
import DuelScreenClient from "@/app/duel/DuelScreenClient";
import BunsAdventuresSlide from "./BunsAdventuresSlide";
import BunsMegaMenuSlide from "./BunsMegaMenuSlide";
import BunsMenuImpactSlide from "./BunsMenuImpactSlide";
import BunsVibeSlide from "./BunsVibeSlide";
import {
  bunsAdventuresCampaign,
  resolveBunsAdventuresEpisode,
} from "@/lib/campaigns/bunsAdventuresCampaign";

type DisplaySlide = {
  id: string;
  titleLines: string[];
  subtitle: string;
  lines: string[];
  image: string | null;
  durationMs: number;
  type: string | null;
  qrAssetPath?: string | null;
  pollOptions?: PollOption[];
  allPollOptions?: string[];
  totalVotes?: number | null;
  pollId?: string | null;
  campaignId?: string | null;
  episodeId?: string | null;
  videoSrc?: string | null;
  episodeNumber?: string | null;
  episodeName?: string | null;
};

type PollOption = {
  option: string;
  votes: number;
  percent: number;
};

type ScreenApiSlide = {
  type?: string | null;
  campaign_id?: string | null;
  poll_id?: string | null;
  product_slug?: string | null;
  headline?: string | null;
  subheadline?: string | null;
  subtitle?: string | null;
  cta?: string | null;
  lines?: string[] | null;
  supporting_lines?: string[] | null;
  image?: string | null;
  duration?: number | null;
  qr_enabled?: boolean | null;
  qr_asset_path?: string | null;
  linked_landing_slug?: string | null;
  linked_landing_url?: string | null;
  total_votes?: number | null;
  poll_options?: string[] | null;
  episode_id?: string | null;
  poll_results_snapshot?: {
    total_votes?: number | null;
    options?: Array<{
      option?: string | null;
      votes?: number | null;
      percent?: number | null;
    }> | null;
  } | null;
  video_src?: string | null;
  episode_number?: string | null;
  episode_name?: string | null;
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
    subtitle: bunsAdventuresCampaign.episodes[0].title,
    lines: [],
    image: null,
    durationMs: 30000,
    type: "buns-adventures",
    videoSrc: bunsAdventuresCampaign.episodes[0].videoSrc,
    episodeId: bunsAdventuresCampaign.episodes[0].id,
    episodeNumber: bunsAdventuresCampaign.episodes[0].number,
    episodeName: bunsAdventuresCampaign.episodes[0].title,
    qrAssetPath: buildQrCodeUrl(
      bunsAdventuresCampaign.episodes[0].linkedUrl ?? "https://www.instagram.com/buns.ericeira/"
    ),
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

const SCREEN_PLAYLIST_URL = "/api/screen";
const FALLBACK_SLIDE_DURATION_MS = 7000;
const POLL_INTERVAL_MS = 15000;
const MIN_LIVE_DURATION_MS = 4000;

export default function ScreenClient() {
  const [index, setIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [wakeLockActive, setWakeLockActive] = useState(false);
  const [liveSlides, setLiveSlides] = useState<DisplaySlide[] | null>(null);
  const [qrImageError, setQrImageError] = useState(false);
  const liveSignatureRef = useRef<string | null>(null);

  const activeSlides = liveSlides && liveSlides.length > 0 ? liveSlides : FALLBACK_SLIDES;
  const isLive = Boolean(liveSlides && liveSlides.length > 0);
  const currentSlide = activeSlides[index] ?? activeSlides[0];
  const slideDurationMs = currentSlide?.durationMs ?? FALLBACK_SLIDE_DURATION_MS;

  useEffect(() => {
    setIndex((current) => (current >= activeSlides.length ? 0 : current));
  }, [activeSlides.length]);

  useEffect(() => {
    setQrImageError(false);
  }, [currentSlide.id, currentSlide.qrAssetPath]);

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIndex((prev) => (prev + 1) % activeSlides.length);
    }, slideDurationMs);

    return () => window.clearTimeout(timeout);
  }, [activeSlides.length, index, slideDurationMs]);

  useEffect(() => {
    let isMounted = true;

    console.log("[screen] fetch_target", SCREEN_PLAYLIST_URL);

    const applyFallback = (reason: string) => {
      console.warn("[screen] using fallback", reason);

      if (!isMounted) {
        return;
      }

      liveSignatureRef.current = null;
      setLiveSlides(null);
    };

    const loadScreen = async () => {
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
  const isPollResultsSlide = currentSlide.type === "poll_results";
  const isWorldRankingSlide =
    isPollResultsSlide &&
    (currentSlide.pollId === "buns-world-ranking" ||
      currentSlide.campaignId === "buns-world-ranking");
  const displayTitleLines = isWorldRankingSlide
    ? ["WHERE ARE YOU", "FROM?"]
    : currentSlide.titleLines;
  const displaySubtitle = isWorldRankingSlide
    ? "PUT YOUR COUNTRY ON THE BUNS LEADERBOARD"
    : currentSlide.subtitle;
  const worldRankingResults = useMemo(
    () => {
      const rankedOptions = (currentSlide.pollOptions ?? [])
        .slice()
        .sort((left, right) => right.votes - left.votes || right.percent - left.percent)
        .slice(0, 3);

      return rankedOptions;
    },
    [currentSlide.pollOptions]
  );

  const isBunsAdventuresSlide =
    currentSlide.type === "buns-adventures" || currentSlide.campaignId === bunsAdventuresCampaign.id;
  const isBunsVibeSlide =
    currentSlide.type === "buns-vibe" || currentSlide.campaignId === "buns-vibe";
  const isBunsMegaMenuSlide =
    currentSlide.type === "buns-mega-menu" || currentSlide.campaignId === "buns-mega-menu";
  const isBunsMenuImpactSlide =
    currentSlide.type === "buns-menu-impact" || currentSlide.campaignId === "buns-menu-impact";
  const isBunsDuelSlide =
    currentSlide.type === "buns-duel" || currentSlide.campaignId === "buns-duel";

  if (isBunsDuelSlide) {
    return (
      <div className="relative h-dvh w-full overflow-hidden">
        <DuelScreenClient />
        <div className="absolute right-4 top-4 z-50 flex items-center gap-3 rounded-sm border border-[#ffd166]/55 bg-black/75 px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.24em] text-[#ffd166] shadow-[0_0_18px_rgba(255,209,102,0.18),0_8px_22px_rgba(0,0,0,0.6)] backdrop-blur-md sm:right-6 sm:top-6">
          <span>{sourceLabel}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffd166] shadow-[0_0_10px_rgba(255,209,102,1)]" />
          <span>{statusLabel}</span>
        </div>
      </div>
    );
  }

  if (isBunsAdventuresSlide) {
    const episode = resolveBunsAdventuresEpisode({
      id: currentSlide.episodeId,
      number: currentSlide.episodeNumber,
      videoSrc: currentSlide.videoSrc,
    });

    return (
      <div className="relative h-dvh w-full overflow-hidden">
        <BunsAdventuresSlide
          episode={episode}
          qrImageUrl={currentSlide.qrAssetPath ?? null}
          qrLabel={bunsAdventuresCampaign.qrLabel}
        />
        <div className="absolute right-4 top-4 z-50 flex items-center gap-3 rounded-sm border border-[#ffd166]/55 bg-black/75 px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.24em] text-[#ffd166] shadow-[0_0_18px_rgba(255,209,102,0.18),0_8px_22px_rgba(0,0,0,0.6)] backdrop-blur-md sm:right-6 sm:top-6">
          <span>{sourceLabel}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffd166] shadow-[0_0_10px_rgba(255,209,102,1)]" />
          <span>{statusLabel}</span>
        </div>
      </div>
    );
  }

  if (isBunsVibeSlide) {
    return (
      <div className="relative h-dvh w-full overflow-hidden">
        <BunsVibeSlide />
        <div className="absolute right-4 top-4 z-50 flex items-center gap-3 rounded-sm border border-[#ffd166]/55 bg-black/75 px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.24em] text-[#ffd166] shadow-[0_0_18px_rgba(255,209,102,0.18),0_8px_22px_rgba(0,0,0,0.6)] backdrop-blur-md sm:right-6 sm:top-6">
          <span>{sourceLabel}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffd166] shadow-[0_0_10px_rgba(255,209,102,1)]" />
          <span>{statusLabel}</span>
        </div>
      </div>
    );
  }

  if (isBunsMegaMenuSlide) {
    return (
      <div className="relative h-dvh w-full overflow-hidden">
        <BunsMegaMenuSlide />
        <div className="absolute right-4 top-4 z-50 flex items-center gap-3 rounded-sm border border-[#ffd166]/55 bg-black/75 px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.24em] text-[#ffd166] shadow-[0_0_18px_rgba(255,209,102,0.18),0_8px_22px_rgba(0,0,0,0.6)] backdrop-blur-md sm:right-6 sm:top-6">
          <span>{sourceLabel}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffd166] shadow-[0_0_10px_rgba(255,209,102,1)]" />
          <span>{statusLabel}</span>
        </div>
      </div>
    );
  }

  if (isBunsMenuImpactSlide) {
    return (
      <div className="relative h-dvh w-full overflow-hidden">
        <BunsMenuImpactSlide />
        <div className="absolute right-4 top-4 z-50 flex items-center gap-3 rounded-sm border border-[#ffd166]/55 bg-black/75 px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.24em] text-[#ffd166] shadow-[0_0_18px_rgba(255,209,102,0.18),0_8px_22px_rgba(0,0,0,0.6)] backdrop-blur-md sm:right-6 sm:top-6">
          <span>{sourceLabel}</span>
          <span className="h-1.5 w-1.5 rounded-full bg-[#ffd166] shadow-[0_0_10px_rgba(255,209,102,1)]" />
          <span>{statusLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <main className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[#050404] px-6 py-8 text-center text-white">
      {currentSlide.image ? (
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url("${currentSlide.image}")` }}
        />
      ) : null}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,209,102,0.26),transparent_30%),radial-gradient(circle_at_bottom,rgba(0,240,255,0.11),transparent_32%),radial-gradient(ellipse_at_80%_18%,rgba(255,80,0,0.08),transparent_40%),linear-gradient(180deg,rgba(6,4,3,0.88),rgba(2,2,1,0.99))]" />
      <div className="pointer-events-none absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,209,102,0.32)_1px,transparent_1px),linear-gradient(90deg,rgba(255,209,102,0.22)_1px,transparent_1px)] [background-size:22px_22px]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-[#ffd166]/20 to-transparent" />

      <div className="absolute right-4 top-4 z-10 flex items-center gap-3 rounded-sm border border-[#ffd166]/55 bg-black/75 px-4 py-1.5 text-[0.65rem] font-black uppercase tracking-[0.24em] text-[#ffd166] shadow-[0_0_18px_rgba(255,209,102,0.18),0_8px_22px_rgba(0,0,0,0.6)] backdrop-blur-md sm:right-6 sm:top-6">
        <span>{sourceLabel}</span>
        <span className="h-1.5 w-1.5 rounded-full bg-[#ffd166] shadow-[0_0_10px_rgba(255,209,102,1)]" />
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
            className={
              isPollResultsSlide
                ? "flex w-full flex-col items-center justify-center gap-6 sm:gap-8"
                : "flex w-full flex-col items-center justify-center gap-14 sm:gap-20"
            }
          >
            <div
              className={
                isPollResultsSlide
                  ? "flex w-full flex-col items-center justify-center gap-3"
                  : "flex min-h-[42dvh] w-full flex-col items-center justify-center gap-6"
              }
            >
              {currentSlide.type ? (
                <p className="rounded-sm border border-[#00f0ff]/45 bg-[#00f0ff]/10 px-4 py-1.5 font-body text-[0.65rem] font-black uppercase tracking-[0.4em] text-[#00f0ff] shadow-[0_0_18px_rgba(0,240,255,0.22),0_8px_20px_rgba(0,0,0,0.45)]">
                  {currentSlide.type}
                </p>
              ) : null}

              <motion.h1
                initial={{ opacity: 0, scale: 0.975 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.1, ease: "easeOut" }}
                className={
                  isPollResultsSlide
                    ? "flex flex-col items-center gap-2 font-display text-[clamp(2.4rem,7vw,4.25rem)] font-black uppercase leading-[0.9] tracking-[0.06em] text-center text-[#ffd166] [text-shadow:0_0_45px_rgba(255,209,102,0.55),0_8px_32px_rgba(0,0,0,0.7)]"
                    : "flex flex-col items-center gap-2 font-display text-[clamp(5.25rem,15vw,8.75rem)] font-black uppercase leading-[0.88] tracking-[0.06em] text-[#ffd166] [text-shadow:0_0_65px_rgba(255,209,102,0.6),0_10px_40px_rgba(0,0,0,0.7)] 2xl:text-[10rem]"
                }
              >
                {displayTitleLines.map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </motion.h1>
            </div>

            <div
              className={
                isPollResultsSlide
                  ? "flex w-full flex-col items-center gap-6"
                  : "flex flex-col items-center gap-8"
              }
            >
              <motion.p
                initial={{ opacity: 0, scale: 0.985 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 1.2, delay: 0.08, ease: "easeOut" }}
                className={
                  isPollResultsSlide
                    ? "max-w-[34rem] font-body text-[clamp(1rem,2.2vw,1.35rem)] font-semibold uppercase leading-[1.2] tracking-[0.22em] text-[#00f0ff]"
                    : "max-w-[28rem] font-body text-[clamp(1.6rem,4.6vw,3rem)] uppercase leading-[1.15] tracking-[0.28em] text-[#c8bfa0] 2xl:text-[3.25rem]"
                }
              >
                {displaySubtitle}
              </motion.p>

              {isWorldRankingSlide && worldRankingResults.length ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                  className="relative z-10 grid w-full max-w-[38rem] gap-4 rounded-[1.35rem] border-2 border-[#ffd166]/40 bg-[linear-gradient(180deg,rgba(8,6,4,0.97),rgba(3,2,1,1))] p-4 shadow-[0_0_0_1px_rgba(255,209,102,0.06),0_32px_75px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,209,102,0.12)] backdrop-blur-md md:grid-cols-[minmax(0,1fr)_auto] md:items-start"
                >
                  <div className="flex min-w-0 flex-col gap-3">
                    <div className="flex items-center justify-between gap-3 rounded-xl border border-[#00f0ff]/20 bg-[#00f0ff]/8 px-4 py-2.5">
                      <div className="text-left">
                        <p className="font-body text-[0.68rem] font-black uppercase tracking-[0.32em] text-[#00f0ff]">
                          Season Live
                        </p>
                        <p className="font-body text-[0.9rem] font-semibold uppercase tracking-[0.14em] text-white/90">
                          Global leaderboard
                        </p>
                      </div>
                      {typeof currentSlide.totalVotes === "number" ? (
                        <div className="rounded-full border border-[#ffd166]/35 bg-[#ffd166]/10 px-3 py-1 text-center">
                          <p className="font-body text-[0.65rem] font-black uppercase tracking-[0.22em] text-[#ffd166]">
                            Total votes
                          </p>
                          <p className="font-display text-[1.25rem] font-black text-white">
                            {currentSlide.totalVotes}
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="rounded-xl border border-[#ffd166]/16 bg-white/[0.03] px-4 py-2 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                      <p className="font-body text-[0.7rem] font-black uppercase tracking-[0.24em] text-[#ffd166]">
                        Live battle
                      </p>
                      <p className="mt-1 font-body text-[0.82rem] font-medium uppercase tracking-[0.1em] text-white/72">
                        Every scan can move the ranking in real time.
                      </p>
                    </div>

                    {worldRankingResults.map((result, resultIndex) => {
                      const isLeader = resultIndex === 0;

                      return (
                        <div
                          key={result.option}
                          className={
                            isLeader
                              ? "grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-[#ffd166]/45 bg-[linear-gradient(90deg,rgba(255,209,102,0.18),rgba(0,0,0,0.72))] px-4 py-3.5 shadow-[0_0_32px_rgba(255,209,102,0.2),0_0_70px_rgba(255,209,102,0.08),inset_0_1px_0_rgba(255,209,102,0.15)]"
                              : "grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border border-white/8 bg-black/60 px-4 py-3"
                          }
                        >
                          <div className="flex h-9 w-9 items-center justify-center rounded-full border border-white/12 bg-white/6 font-display text-[0.95rem] font-black text-[#ffd166]">
                            #{resultIndex + 1}
                          </div>
                          <div className="text-[1.7rem] leading-none">{getCountryFlag(result.option)}</div>
                          <div className="min-w-0 text-left">
                            {isLeader ? (
                              <p className="mb-1 font-body text-[0.6rem] font-black uppercase tracking-[0.28em] text-[#ffd166]">
                                Leading
                              </p>
                            ) : null}
                            <p
                              className={
                                isLeader
                                  ? "truncate font-body text-[1rem] font-black uppercase tracking-[0.14em] text-white"
                                  : "truncate font-body text-[0.95rem] font-bold uppercase tracking-[0.12em] text-white"
                              }
                            >
                              {result.option}
                            </p>
                            <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-white/10">
                              <div
                                className={
                                  isLeader
                                    ? "h-full rounded-full bg-[linear-gradient(90deg,#ffd166,#ffb703)]"
                                    : "h-full rounded-full bg-[linear-gradient(90deg,#00f0ff,#009dff)]"
                                }
                                style={{ width: `${Math.max(result.percent, result.votes > 0 ? 8 : 0)}%` }}
                              />
                            </div>
                          </div>
                          <div className="rounded-lg border border-[#00f0ff]/30 bg-[#00f0ff]/10 px-3 py-1.5 text-right">
                            <p className="font-body text-[0.63rem] font-black uppercase tracking-[0.2em] text-[#00f0ff]">
                              {result.votes} votes
                            </p>
                            <p className="font-display text-[1.05rem] font-black text-white">
                              {result.percent}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {currentSlide.qrAssetPath && !qrImageError ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-[#ffd166]/50 bg-[linear-gradient(180deg,rgba(255,209,102,0.14),rgba(0,0,0,0.65))] px-4 py-4 shadow-[0_0_0_1px_rgba(255,209,102,0.08),0_20px_50px_rgba(0,0,0,0.65)] md:w-[10rem]">
                      <img
                        src={currentSlide.qrAssetPath}
                        alt="QR code"
                        onError={() => setQrImageError(true)}
                        className="h-28 w-28 rounded-lg border-2 border-[#ffd166]/50 bg-white p-2 shadow-[0_0_22px_rgba(255,209,102,0.22),0_12px_32px_rgba(0,0,0,0.5)] md:h-32 md:w-32"
                      />
                      <div className="space-y-1 text-center">
                        <p className="font-body text-[0.7rem] font-black uppercase tracking-[0.24em] text-[#ffd166]">
                          Scan to represent your country
                        </p>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              ) : isPollResultsSlide && currentSlide.pollOptions?.length ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                  className="relative z-10 grid w-full max-w-[38rem] gap-4 rounded-[1.25rem] border-2 border-[#ffd166]/38 bg-[linear-gradient(180deg,rgba(8,6,4,0.95),rgba(3,2,1,0.99))] p-4 shadow-[0_0_0_1px_rgba(255,209,102,0.06),0_32px_75px_rgba(0,0,0,0.75),inset_0_1px_0_rgba(255,209,102,0.12)] backdrop-blur-md md:grid-cols-[minmax(0,1fr)_auto] md:items-start"
                >
                  <div className="flex min-w-0 flex-col gap-3">
                    {currentSlide.pollOptions.map((result) => (
                      <div
                        key={result.option}
                        className="flex items-center justify-between gap-4 rounded-lg border border-white/8 bg-black/60 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,209,102,0.06)]"
                      >
                        <span className="font-body text-[clamp(0.95rem,2vw,1.2rem)] font-semibold uppercase tracking-[0.14em] text-white">
                          {result.option}
                        </span>
                        <span className="shrink-0 rounded-sm border border-[#00f0ff]/40 bg-[#00f0ff]/10 px-3 py-1 font-body text-[clamp(0.85rem,1.7vw,1rem)] font-bold uppercase tracking-[0.12em] text-[#00f0ff]">
                          {result.votes} votes • {result.percent}%
                        </span>
                      </div>
                    ))}
                    {typeof currentSlide.totalVotes === "number" ? (
                      <p className="pt-2 text-center font-body text-[clamp(0.95rem,1.9vw,1.15rem)] font-black uppercase tracking-[0.3em] text-[#ffd166]">
                        Total votes: {currentSlide.totalVotes}
                      </p>
                    ) : null}
                  </div>

                  {currentSlide.qrAssetPath && !qrImageError ? (
                    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-[#ffd166]/50 bg-[linear-gradient(180deg,rgba(255,209,102,0.14),rgba(0,0,0,0.65))] px-4 py-4 shadow-[0_0_0_1px_rgba(255,209,102,0.08),0_20px_50px_rgba(0,0,0,0.65)] md:w-[10rem]">
                      <img
                        src={currentSlide.qrAssetPath}
                        alt="QR code"
                        onError={() => setQrImageError(true)}
                        className="h-28 w-28 rounded-lg border-2 border-[#ffd166]/50 bg-white p-2 shadow-[0_0_22px_rgba(255,209,102,0.22),0_12px_32px_rgba(0,0,0,0.5)] md:h-32 md:w-32"
                      />
                      <p className="text-center font-body text-[0.7rem] font-black uppercase tracking-[0.24em] text-[#ffd166]">
                        Scan to vote
                      </p>
                    </div>
                  ) : null}
                </motion.div>
              ) : detailLines.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.9, delay: 0.15, ease: "easeOut" }}
                  className="flex max-w-[34rem] flex-col items-center gap-3 rounded-xl border border-[#ffd166]/28 bg-black/55 px-6 py-5 shadow-[0_0_0_1px_rgba(0,0,0,0.5),0_18px_45px_rgba(0,0,0,0.65)]"
                >
                  {detailLines.map((line) => (
                    <p
                      key={line}
                      className="font-body text-[clamp(1rem,2.1vw,1.35rem)] font-semibold uppercase tracking-[0.24em] text-white"
                    >
                      {line}
                    </p>
                  ))}
                </motion.div>
              ) : null}

              {currentSlide.qrAssetPath && !isPollResultsSlide && !qrImageError ? (
                <motion.img
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.9, delay: 0.2, ease: "easeOut" }}
                  src={currentSlide.qrAssetPath}
                  alt="QR code"
                  onError={() => setQrImageError(true)}
                  className="h-36 w-36 rounded-xl border-2 border-[#ffd166]/55 bg-white p-2 shadow-[0_0_28px_rgba(255,209,102,0.25),0_18px_50px_rgba(0,0,0,0.6)]"
                />
              ) : null}
            </div>
          </motion.div>
        </AnimatePresence>
      </section>
    </main>
  );
}

function normalizeLiveSlides(payload: ScreenApiResponse): DisplaySlide[] | null {
  if (!Array.isArray(payload.slides) || payload.slides.length === 0) {
    return null;
  }

  const slides = payload.slides
    .map((slide, index) => normalizeLiveSlide(slide, index))
    .filter((slide): slide is DisplaySlide => slide !== null);

  if (slides.length === 0) {
    return null;
  }

  const prioritySlides = slides.filter(
    (slide) =>
      slide.type === "poll_results" ||
      slide.type === "buns-adventures" ||
      slide.type === "buns-vibe" ||
      slide.type === "buns-mega-menu" ||
      slide.type === "buns-menu-impact" ||
      slide.type === "buns-duel" ||
      slide.campaignId === "buns-duel"
  );

  return prioritySlides.length > 0 ? prioritySlides : slides;
}

function normalizeLiveSlide(slide: ScreenApiSlide, index: number): DisplaySlide | null {
  const headline = slide.headline?.trim();
  const subtitle = slide.subheadline?.trim() || slide.subtitle?.trim() || "";
  const detailLines = [...(slide.lines ?? []), ...(slide.supporting_lines ?? [])]
    .map((line) => line.trim())
    .filter((line, lineIndex, allLines) => line.length > 0 && allLines.indexOf(line) === lineIndex);

  const pollOptions =
    slide.type === "poll_results"
      ? (slide.poll_results_snapshot?.options ?? [])
          .map((result) => {
            const option = result.option?.trim();

            if (!option) {
              return null;
            }

            return {
              option,
              votes: normalizeCount(result.votes),
              percent: normalizeCount(result.percent),
            };
          })
          .filter((result): result is PollOption => result !== null)
      : undefined;

  const pollFallbackOptions =
    slide.type === "poll_results"
      ? (slide.poll_options ?? [])
          .map((option) => option?.trim())
          .filter((option): option is string => Boolean(option))
          .map((option) => ({ option, votes: 0, percent: 0 }))
      : undefined;

  const resolvedPollOptions =
    slide.type === "poll_results" && pollOptions && pollOptions.length > 0
      ? pollOptions
      : pollFallbackOptions;

  const isBunsAdventuresCampaign =
    slide.type?.trim() === "buns-adventures" ||
    slide.campaign_id?.trim() === bunsAdventuresCampaign.id;
  const isBunsVibeCampaign =
    slide.type?.trim() === "buns-vibe" || slide.campaign_id?.trim() === "buns-vibe";
  const isBunsMegaMenuCampaign =
    slide.type?.trim() === "buns-mega-menu" ||
    slide.campaign_id?.trim() === "buns-mega-menu";
  const isBunsMenuImpactCampaign =
    slide.type?.trim() === "buns-menu-impact" ||
    slide.campaign_id?.trim() === "buns-menu-impact";
  const isBunsDuelCampaign =
    slide.type?.trim() === "buns-duel" || slide.campaign_id?.trim() === "buns-duel";
  const bunsAdventuresEpisode = isBunsAdventuresCampaign
    ? resolveBunsAdventuresEpisode({
        id: slide.episode_id,
        number: slide.episode_number,
        title: slide.episode_name ?? slide.subtitle ?? slide.subheadline,
        videoSrc: slide.video_src,
      })
    : null;

  if (
    !headline &&
    !isBunsDuelCampaign &&
    !isBunsVibeCampaign &&
    !isBunsMegaMenuCampaign &&
    !isBunsMenuImpactCampaign
  ) {
    return null;
  }

  const resolvedHeadline = headline
    || (isBunsVibeCampaign
      ? "BUNS ERICEIRA"
      : isBunsMegaMenuCampaign
        ? "BUNS MEGA MENU"
      : isBunsMenuImpactCampaign
        ? "BUNS MENU IMPACT"
        : "BUNS DUEL");

  return {
    id: slide.product_slug?.trim() || `${slide.type ?? "screen"}-${index + 1}`,
    titleLines: splitTitleLines(resolvedHeadline),
    subtitle,
    lines: detailLines.length > 0 ? detailLines : slide.cta?.trim() ? [slide.cta.trim()] : [],
    image: slide.image?.trim() || null,
    durationMs: normalizeDurationMs(slide.duration),
    type: slide.type?.trim() || null,
    qrAssetPath: isBunsAdventuresCampaign
      ? buildQrCodeUrl(
          bunsAdventuresEpisode?.linkedUrl ?? "https://www.instagram.com/buns.ericeira/"
        )
      : resolveQrAssetPath(slide),
    pollOptions: resolvedPollOptions,
    allPollOptions:
      slide.type === "poll_results"
        ? (slide.poll_options ?? [])
            .map((option) => option?.trim())
            .filter((option): option is string => Boolean(option))
        : undefined,
    pollId: slide.poll_id?.trim() || null,
    campaignId: slide.campaign_id?.trim() || null,
    episodeId: bunsAdventuresEpisode?.id ?? slide.episode_id?.trim() ?? null,
    totalVotes:
      slide.type === "poll_results"
        ? normalizeCount(slide.total_votes ?? slide.poll_results_snapshot?.total_votes)
        : null,
    videoSrc: bunsAdventuresEpisode?.videoSrc ?? slide.video_src?.trim() ?? null,
    episodeNumber: bunsAdventuresEpisode?.number ?? slide.episode_number?.trim() ?? null,
    episodeName: bunsAdventuresEpisode?.title ?? slide.episode_name?.trim() ?? null,
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

function normalizeCount(value: number | null | undefined) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return 0;
  }

  return Math.max(0, Math.round(value));
}

function resolveQrAssetPath(slide: ScreenApiSlide) {
  const landingUrl = resolveLandingUrl(slide);

  if (landingUrl) {
    return buildQrCodeUrl(landingUrl);
  }

  return slide.qr_enabled ? slide.qr_asset_path?.trim() || null : null;
}

function buildQrCodeUrl(targetUrl: string) {
  return `https://api.qrserver.com/v1/create-qr-code/?size=512x512&data=${encodeURIComponent(
    targetUrl
  )}`;
}

function resolveLandingUrl(slide: ScreenApiSlide) {
  const rawUrl = slide.linked_landing_url?.trim();

  if (rawUrl) {
    if (/^https?:\/\//i.test(rawUrl)) {
      return rawUrl;
    }

    return `${getPublicSiteOrigin()}${rawUrl.startsWith("/") ? rawUrl : `/${rawUrl}`}`;
  }

  const slug = slide.linked_landing_slug?.trim();

  if (slug) {
    return `${getPublicSiteOrigin()}/lp/${slug}`;
  }

  return null;
}

function getPublicSiteOrigin() {
  return process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") || "https://buns-ericeira.pt";
}

function getCountryFlag(country: string) {
  switch (country.trim().toLowerCase()) {
    case "portugal":
      return "🇵🇹";
    case "germany":
      return "🇩🇪";
    case "france":
      return "🇫🇷";
    case "united kingdom":
      return "🇬🇧";
    case "netherlands":
      return "🇳🇱";
    case "spain":
      return "🇪🇸";
    case "italy":
      return "🇮🇹";
    case "united states":
      return "🇺🇸";
    case "brazil":
      return "🇧🇷";
    case "ireland":
      return "🇮🇪";
    case "belgium":
      return "🇧🇪";
    case "sweden":
      return "🇸🇪";
    case "denmark":
      return "🇩🇰";
    case "australia":
      return "🇦🇺";
    default:
      return "🌍";
  }
}
