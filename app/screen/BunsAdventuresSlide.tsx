"use client";

import { motion } from "framer-motion";
import { type SyntheticEvent, useEffect, useRef, useState } from "react";
import {
  bunsAdventuresCampaign,
  type BunsAdventuresEpisode,
} from "@/lib/campaigns/bunsAdventuresCampaign";

type Props = {
  episode: BunsAdventuresEpisode;
  /** Pre-computed QR image URL from ScreenClient. Omit to hide QR. */
  qrImageUrl?: string | null;
  qrLabel?: string;
};

/**
 * Full-screen vertical slide for the BUNS ADVENTURES campaign.
 * Design: anime vertical poster — video is the canvas, UI is stenciled on top.
 *
 * Layout zones (top → bottom):
 *   [0–10%]  thin header: BUNS ADVENTURES + S01 badge
 *   [10–70%] pure video — characters live here, title sits at the edge
 *   [72–82%] episode title card (EP badge + big title)
 *   [85–100%] footer strip: BUNS & BUNANA + QR
 */
export default function BunsAdventuresSlide({
  episode,
  qrImageUrl,
  qrLabel = "SCAN TO FOLLOW",
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const activeEpisodeIdRef = useRef<string | null>(null);
  const advancedEpisodeIdRef = useRef<string | null>(null);
  const transitionLockRef = useRef(false);
  const [qrError, setQrError] = useState(false);
  const [currentEpisodeIndex, setCurrentEpisodeIndex] = useState(() =>
    getEpisodeIndex(episode)
  );
  const currentEpisode =
    bunsAdventuresCampaign.episodes[currentEpisodeIndex] ?? bunsAdventuresCampaign.episodes[0];

  useEffect(() => {
    setQrError(false);
  }, [qrImageUrl]);

  useEffect(() => {
    activeEpisodeIdRef.current = currentEpisode.id;
    advancedEpisodeIdRef.current = null;
    transitionLockRef.current = false;
    console.log("[buns-adventures] active_episode", {
      id: currentEpisode.id,
      title: currentEpisode.title,
      videoSrc: currentEpisode.videoSrc,
    });

    const video = videoRef.current;

    if (!video) {
      return;
    }

    video.load();
    void video.play().catch((error) => {
      console.log("[buns-adventures] play_rejected", {
        id: currentEpisode.id,
        title: currentEpisode.title,
        videoSrc: currentEpisode.videoSrc,
        message: error instanceof Error ? error.message : String(error),
      });
    });
  }, [currentEpisode.id, currentEpisode.title, currentEpisode.videoSrc]);

  const showQr = Boolean(qrImageUrl) && !qrError;
  const playNextEpisode = (
    reason: "ended" | "error",
    sourceEpisodeId: string,
    videoElement: HTMLVideoElement | null
  ) => {
    if (activeEpisodeIdRef.current !== sourceEpisodeId) {
      console.log("[buns-adventures] ignore_stale_advance", {
        reason,
        sourceEpisodeId,
        activeEpisodeId: activeEpisodeIdRef.current,
      });
      return;
    }

    if (videoElement && videoRef.current !== videoElement) {
      console.log("[buns-adventures] ignore_replaced_video_event", {
        reason,
        sourceEpisodeId,
      });
      return;
    }

    if (transitionLockRef.current || advancedEpisodeIdRef.current === sourceEpisodeId) {
      console.log("[buns-adventures] ignore_duplicate_advance", {
        reason,
        sourceEpisodeId,
      });
      return;
    }

    transitionLockRef.current = true;
    advancedEpisodeIdRef.current = sourceEpisodeId;
    console.log("[buns-adventures] advance_episode", {
      reason,
      sourceEpisodeId,
    });
    setCurrentEpisodeIndex((currentIndex) =>
      (currentIndex + 1) % bunsAdventuresCampaign.episodes.length
    );
  };

  const handleEnded = (event: SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = event.currentTarget;
    console.log("[buns-adventures] onEnded", {
      id: currentEpisode.id,
      title: currentEpisode.title,
      currentTime: videoElement.currentTime,
      duration: videoElement.duration,
    });
    playNextEpisode("ended", currentEpisode.id, videoElement);
  };

  const handleError = (event: SyntheticEvent<HTMLVideoElement, Event>) => {
    const videoElement = event.currentTarget;
    const mediaError = videoElement.error;
    console.log("[buns-adventures] onError", {
      id: currentEpisode.id,
      title: currentEpisode.title,
      videoSrc: currentEpisode.videoSrc,
      code: mediaError?.code ?? null,
      message: mediaError?.message ?? null,
      networkState: videoElement.networkState,
      readyState: videoElement.readyState,
    });
    playNextEpisode("error", currentEpisode.id, videoElement);
  };

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#050404] text-white">

      {/* ── VIDEO — breathing canvas ─────────────────────────────
           Slow 1→1.04 scale loop prevents the "static poster" read
           you get with a locked frame on a physical TV.
           Parent overflow-hidden clips the scale overshoot.          */}
      <motion.video
        ref={videoRef}
        key={currentEpisode.id}
        src={currentEpisode.videoSrc}
        muted
        playsInline
        autoPlay
        onEnded={handleEnded}
        onError={handleError}
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 34, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0 h-full w-full object-cover"
      />

      {/* ── ATMOSPHERE ──────────────────────────────────────────── */}

      {/* Grid texture — very subtle, adds screen depth at distance */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.06] [background-image:linear-gradient(rgba(255,209,102,0.7)_1px,transparent_1px),linear-gradient(90deg,rgba(255,209,102,0.5)_1px,transparent_1px)] [background-size:28px_28px]" />

      {/* Top veil — lighter so video brightness reads through the header zone */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[20%] bg-gradient-to-b from-black/58 via-black/18 to-transparent" />

      {/* Bottom veil — covers the lower third for legibility;
           starts at 90% opacity at the very bottom (footer strip)
           but only reaches 50% by the time it hits the title zone,
           keeping characters/colours visible in the mid frame.       */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[48%] bg-gradient-to-t from-black/92 via-black/52 to-transparent" />

      {/* Left neon stripe — thin brand signature, manga panel energy */}
      <div className="pointer-events-none absolute inset-y-0 left-0 w-[3px] bg-gradient-to-b from-transparent via-[#ffd166] to-transparent opacity-65" />

      {/* ── HEADER — top brand strip ──────────────────────────────
           Compact. Floats over the top veil.                         */}
      <motion.div
        initial={{ opacity: 0, y: -14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="absolute left-0 right-0 top-0 z-10 flex items-start justify-between px-5 pt-6"
      >
        <div className="flex flex-col gap-1">
          <motion.span
            animate={{
              textShadow: [
                "0 0 18px rgba(255,209,102,0.45)",
                "0 0 50px rgba(255,209,102,0.88)",
                "0 0 18px rgba(255,209,102,0.45)",
              ],
            }}
            transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
            className="font-display text-[clamp(1.05rem,3.2vw,1.5rem)] font-black uppercase leading-none tracking-[0.12em] text-[#ffd166]"
          >
            BUNS ADVENTURES
          </motion.span>
          <span className="font-body text-[clamp(0.5rem,1.4vw,0.68rem)] font-black uppercase tracking-[0.48em] text-[#00f0ff] [text-shadow:0_0_12px_rgba(0,240,255,0.55)]">
            ERICEIRA STORIES
          </span>
        </div>

        <span className="rounded-sm border border-[#ffd166]/45 bg-black/55 px-2.5 py-1 font-mono text-[0.58rem] font-black uppercase tracking-[0.24em] text-[#ffd166] backdrop-blur-sm">
          S01
        </span>
      </motion.div>

      {/* ── EPISODE TITLE CARD ────────────────────────────────────
           Positioned at bottom-[22%] so the title sits inside the
           video action zone — characters above, title overlaid.
           Separated from the footer strip so text doesn't pile up
           at the very bottom of the TV.                             */}
      <motion.div
        initial={{ opacity: 0, y: 22 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.95, delay: 0.28, ease: "easeOut" }}
        className="absolute bottom-[30%] left-0 right-0 z-10 px-5"
      >
        {/* "NOW PLAYING" label with fading rule */}
        <div className="mb-3 flex items-center gap-3">
          <div className="h-px flex-1 bg-gradient-to-r from-[#ffd166]/50 to-transparent" />
          <span className="font-mono text-[0.54rem] font-black uppercase tracking-[0.55em] text-[#ffd166]/55">
            NOW PLAYING
          </span>
        </div>

        {/* EP badge + hairline divider */}
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-sm bg-[#ffd166] px-3.5 py-1 font-mono text-[0.85rem] font-black uppercase tracking-[0.2em] text-black shadow-[0_0_28px_rgba(255,209,102,0.75),0_0_8px_rgba(255,209,102,0.9)]">
            EP. {currentEpisode.number}
          </span>
          <div className="h-px flex-1 bg-white/10" />
        </div>

        {/* Episode title — 15% larger than before for TV readability
             clamp: 3rem mobile floor / 10.5vw fluid / 5.2rem ceiling
             Slow opacity breath keeps the title alive without distracting  */}
        <motion.h2
          animate={{ opacity: [0.88, 1, 0.88] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
          className="font-display text-[clamp(3rem,10.5vw,5.2rem)] font-black uppercase leading-[0.88] tracking-[0.03em] text-white [text-shadow:0_2px_56px_rgba(0,0,0,1),0_0_40px_rgba(255,209,102,0.22),0_0_90px_rgba(255,209,102,0.10)]"
        >
          {currentEpisode.title}
        </motion.h2>
      </motion.div>

      {/* ── FOOTER STRIP ─────────────────────────────────────────
           Anchored at the very bottom. Characters callout on left,
           QR on right. Distinct from the title block above.         */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.45, ease: "easeOut" }}
        className="absolute bottom-0 left-0 right-0 z-10 flex items-end justify-between gap-4 px-5 pb-7"
      >
        {/* Characters callout */}
        <div className="flex flex-col gap-1">
          <span className="font-body text-[0.54rem] font-black uppercase tracking-[0.42em] text-[#00f0ff]/72 [text-shadow:0_0_10px_rgba(0,240,255,0.38)]">
            FEATURING
          </span>
          <motion.span
            animate={{
              textShadow: [
                "0 0 14px rgba(255,209,102,0.32)",
                "0 0 40px rgba(255,209,102,0.72)",
                "0 0 14px rgba(255,209,102,0.32)",
              ],
            }}
            transition={{ duration: 4.2, repeat: Infinity, ease: "easeInOut" }}
            className="font-display text-[clamp(1rem,3.2vw,1.5rem)] font-black uppercase leading-none tracking-[0.08em] text-[#ffd166]"
          >
            BUNS & BUNANA
          </motion.span>
        </div>

        {/* QR — small, bottom-right, slight glow, does not overpower */}
        {showQr ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.88 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.58, ease: "easeOut" }}
            className="flex shrink-0 flex-col items-center gap-1.5"
          >
            <div className="overflow-hidden rounded-lg border border-[#ffd166]/45 bg-white p-[5px] shadow-[0_0_24px_rgba(255,209,102,0.28)]">
              <img
                src={qrImageUrl!}
                alt="QR code — scan to follow the story"
                onError={() => setQrError(true)}
                className="block h-[4rem] w-[4rem]"
              />
            </div>
            <span className="font-body text-[0.5rem] font-black uppercase tracking-[0.24em] text-[#ffd166]/68">
              {qrLabel}
            </span>
          </motion.div>
        ) : null}
      </motion.div>
    </div>
  );
}

function getEpisodeIndex(episode: BunsAdventuresEpisode) {
  return Math.max(
    0,
    bunsAdventuresCampaign.episodes.findIndex(
      (candidate) =>
        candidate.id === episode.id ||
        candidate.number === episode.number ||
        candidate.videoSrc === episode.videoSrc
    )
  );
}
