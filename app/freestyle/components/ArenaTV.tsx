"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Radio,
  Timer,
  Flame,
  Film,
  Layers,
  EyeOff,
  Maximize2,
  Minimize2,
} from "lucide-react";
import type { FreestyleSession } from "../data/sessions.mock";

type Channel = "LIVE" | "HIGHLIGHTS" | "SESSIONS";
type Skin = "HUD" | "RAW";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

const SKIN_STORAGE_KEY = "buns_arena_tv_skin_v1";

export default function ArenaTV({ session }: { session: FreestyleSession }) {
  const [channel, setChannel] = useState<Channel>("LIVE");
  const [skin, setSkin] = useState<Skin>("HUD");
  const [tvMode, setTvMode] = useState(false);

  // load skin (1x)
  useEffect(() => {
    try {
      const savedSkin = localStorage.getItem(SKIN_STORAGE_KEY) as Skin | null;
      if (savedSkin === "HUD" || savedSkin === "RAW") setSkin(savedSkin);
    } catch {}
  }, []);

  // persist skin
  useEffect(() => {
    try {
      localStorage.setItem(SKIN_STORAGE_KEY, skin);
    } catch {}
  }, [skin]);

  const statusLabel =
    session.status === "LIVE"
      ? "LIVE NOW"
      : session.status === "NEXT"
      ? "NEXT SESSION"
      : "ARCHIVE MODE";

  const media = useMemo(() => {
    const live = session.featuredVideoUrl;
    const highlights = session.featuredReplayUrl;
    const sessions = session.featuredTrailerUrl;
    return { live, highlights, sessions };
  }, [session]);

  // Se canal não tiver media, tenta outro disponível
  useEffect(() => {
    if (channel === "LIVE" && !media.live && media.highlights)
      setChannel("HIGHLIGHTS");
    if (
      channel === "LIVE" &&
      !media.live &&
      !media.highlights &&
      media.sessions
    )
      setChannel("SESSIONS");
    if (channel === "HIGHLIGHTS" && !media.highlights && media.live)
      setChannel("LIVE");
    if (channel === "SESSIONS" && !media.sessions && media.live)
      setChannel("LIVE");
  }, [channel, media.live, media.highlights, media.sessions]);

  const activeVideoSrc =
    channel === "LIVE"
      ? media.live
      : channel === "HIGHLIGHTS"
      ? media.highlights
      : channel === "SESSIONS"
      ? media.sessions
      : null;

  const hasVideo = Boolean(activeVideoSrc);

  // HUD on/off
  const showHUD = skin !== "RAW";

  function toggleRaw() {
    setSkin((p) => (p === "RAW" ? "HUD" : "RAW"));
  }

  const TV = (
    <div className="relative rounded-[28px] p-[2px] bg-gradient-to-br from-yellow-300 via-amber-500 to-orange-600 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
      <div className="rounded-[26px] bg-[#0c0906]/90 backdrop-blur-sm border border-white/10 overflow-hidden">
        {/* TV screen */}
        <div className="relative aspect-video bg-black">
          {/* VIDEO (loop) */}
          {hasVideo ? (
            <video
              className="absolute inset-0 h-full w-full object-contain"
              src={activeVideoSrc!}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
            />
          ) : null}

          {/* overlays (desligáveis no RAW) */}
          {showHUD ? (
            <>
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[radial-gradient(circle,rgba(255,200,0,0.18),transparent_55%)]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.18)_50%,transparent_100%)] [background-size:100%_9px]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_center,transparent_45%,rgba(0,0,0,0.9)_100%)]"
              />
            </>
          ) : null}

          {/* HUD overlay */}
          {showHUD ? (
            <div className="absolute inset-0 p-4 sm:p-6 flex flex-col justify-between">
              {/* TOP HUD */}
              <div className="flex items-center gap-2 text-white/90">
                <Flame className="h-5 w-5 text-buns-yellow" />
                <div className="font-display text-lg sm:text-2xl">
                  BUNS <span className="text-buns-yellow">FREESTYLE</span>
                </div>

                <span
                  className={cx(
                    "ml-auto inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
                    session.status === "LIVE"
                      ? "border-red-400/40 bg-red-500/15 text-red-200"
                      : "border-white/10 bg-black/40 text-white/70"
                  )}
                >
                  <Radio className="h-3.5 w-3.5" />
                  {statusLabel}
                </span>
              </div>

              {/* CENTER */}
              {!hasVideo ? (
                <div className="text-center">
                  <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70">
                    <span className="h-2 w-2 rounded-full bg-buns-yellow/90" />
                    TV NOISE MODE · A preparar transmissão
                  </div>
                  <div className="mt-2 text-white/60 text-sm">
                    Quando tiveres Twitch/YouTube/MP4, isto vira “Arena Live”.
                  </div>
                </div>
              ) : null}

              {/* BOTTOM HUD */}
              <div className="flex flex-wrap items-end justify-between gap-3">
                <div>
                  <div className="text-xs tracking-[0.22em] text-white/60">
                    SESSION
                  </div>
                  <div className="font-display text-2xl sm:text-4xl text-white">
                    {session.title}
                  </div>
                  <div className="mt-1 text-white/70 text-sm">{session.date}</div>
                </div>

                <div className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-black/40 px-4 py-3">
                  <Timer className="h-4 w-4 text-amber-300" />
                  <div className="text-sm text-white/80">
                    ROUND TIME:{" "}
                    <span className="text-buns-yellow font-semibold">00:45</span>{" "}
                    (demo)
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-black/40 px-3 py-1 text-xs text-white/70">
              <EyeOff className="h-3.5 w-3.5" />
              RAW FEED
            </div>
          )}
        </div>

        {/* CONTROLS BAR (fora do ecrã) */}
        <div className="p-3 sm:p-4 bg-white/5 border-t border-white/10">
          <div className="flex flex-wrap items-center gap-2">
            {/* Channels */}
            <ChannelButton
              active={channel === "LIVE"}
              onClick={() => setChannel("LIVE")}
              icon={<Radio className="h-4 w-4" />}
              label="LIVE"
              hint={media.live ? "Canal principal" : "Sem feed"}
              disabled={!media.live}
            />
            <ChannelButton
              active={channel === "HIGHLIGHTS"}
              onClick={() => setChannel("HIGHLIGHTS")}
              icon={<Film className="h-4 w-4" />}
              label="HIGHLIGHTS"
              hint={media.highlights ? "Reels/curtos" : "Sem vídeo"}
              disabled={!media.highlights}
            />
            <ChannelButton
              active={channel === "SESSIONS"}
              onClick={() => setChannel("SESSIONS")}
              icon={<Layers className="h-4 w-4" />}
              label="SESSIONS"
              hint={media.sessions ? "Full sessions" : "Sem vídeo"}
              disabled={!media.sessions}
            />

            <div className="flex-1" />

            {/* RAW toggle (único “skin” que fica) */}
            <button
              type="button"
              onClick={toggleRaw}
              className={cx(
                "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
                skin === "RAW"
                  ? "border-buns-yellow/40 bg-buns-yellow/10 text-amber-100"
                  : "border-white/10 bg-black/30 text-white/70 hover:bg-black/40"
              )}
              title={skin === "RAW" ? "Voltar ao HUD" : "Modo RAW (sem HUD)"}
            >
              <EyeOff className="h-4 w-4" />
              RAW
            </button>

            {/* TV MODE (fullscreen com scroll) */}
            <button
              type="button"
              onClick={() => setTvMode(true)}
              className="inline-flex items-center gap-2 rounded-2xl border border-buns-yellow/30 bg-buns-yellow/10 px-3 py-2 text-sm text-amber-100 hover:bg-buns-yellow/15"
              title="Abrir TV em modo foco"
            >
              <Maximize2 className="h-4 w-4" />
              TV
            </button>
          </div>

          <p className="mt-3 text-white/75 text-sm sm:text-base">
            {session.notes ?? "Sem palco. Sem filtros. Só pressão."}
          </p>
        </div>
      </div>
    </div>
  );

  // TV MODE overlay com scroll
  if (!tvMode) return TV;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="mx-auto w-full max-w-6xl px-4 py-6">
        <div className="flex items-center justify-between mb-4 text-white/80">
          <div className="text-sm">
            Modo TV · <span className="text-white/60">{skin}</span> ·{" "}
            <span className="text-white/60">{channel}</span>
          </div>
          <button
            type="button"
            onClick={() => setTvMode(false)}
            className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-2 text-sm hover:bg-black/50"
          >
            <Minimize2 className="h-4 w-4" />
            Fechar
          </button>
        </div>

        {TV}
      </div>
    </div>
  );
}

function ChannelButton({
  active,
  onClick,
  icon,
  label,
  hint,
  disabled,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={hint}
      className={cx(
        "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition",
        disabled
          ? "border-white/10 bg-black/20 text-white/30 cursor-not-allowed"
          : active
          ? "border-buns-yellow/40 bg-buns-yellow/10 text-amber-100"
          : "border-white/10 bg-black/30 text-white/70 hover:bg-black/40"
      )}
    >
      {icon}
      {label}
    </button>
  );
}
