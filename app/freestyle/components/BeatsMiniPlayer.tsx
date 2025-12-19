"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  Music2,
} from "lucide-react";

type Track = {
  title: string;
  artist?: string;
  src: string; // /media/beats/beat-1.mp3
  tag?: string; // "BPM 140" / "DARK" etc
};

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function fmtTime(sec: number) {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function BeatsMiniPlayer({
  tracks,
  defaultIndex = 0,
  compact = true,
}: {
  tracks: Track[];
  defaultIndex?: number;
  compact?: boolean;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const safeTracks = useMemo(() => tracks?.filter(Boolean) ?? [], [tracks]);
  const [idx, setIdx] = useState(() =>
    Math.min(Math.max(defaultIndex, 0), Math.max(safeTracks.length - 1, 0))
  );

  const [ready, setReady] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [vol, setVol] = useState(0.85);

  const [cur, setCur] = useState(0);
  const [dur, setDur] = useState(0);

  const current = safeTracks[idx];

  // init volume / loop
  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.volume = vol;
    audioRef.current.loop = loop;
  }, [vol, loop]);

  // when track changes, load + (optionally) continue playing
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current?.src) return;

    setReady(false);
    setCur(0);
    setDur(0);

    a.src = current.src;
    a.load();

    const onLoaded = () => {
      setDur(a.duration || 0);
      setReady(true);
    };
    const onTime = () => setCur(a.currentTime || 0);
    const onEnd = () => {
      if (loop) return;
      next();
    };

    a.addEventListener("loadedmetadata", onLoaded);
    a.addEventListener("timeupdate", onTime);
    a.addEventListener("ended", onEnd);

    // if already playing, attempt autoplay (may be blocked — fine)
    if (playing) {
      a.play().catch(() => setPlaying(false));
    }

    return () => {
      a.removeEventListener("loadedmetadata", onLoaded);
      a.removeEventListener("timeupdate", onTime);
      a.removeEventListener("ended", onEnd);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idx]);

  async function toggle() {
    const a = audioRef.current;
    if (!a) return;

    try {
      if (playing) {
        a.pause();
        setPlaying(false);
      } else {
        await a.play();
        setPlaying(true);
      }
    } catch {
      setPlaying(false);
    }
  }

  function prev() {
    setIdx((p) => (p - 1 + safeTracks.length) % safeTracks.length);
  }
  function next() {
    setIdx((p) => (p + 1) % safeTracks.length);
  }

  function seekTo(ratio: number) {
    const a = audioRef.current;
    if (!a || !dur) return;
    a.currentTime = Math.max(0, Math.min(dur, ratio * dur));
  }

  if (!safeTracks.length) return null;

  return (
    <section className="rounded-3xl border border-white/10 bg-black/40 overflow-hidden">
      {/* top strip */}
      <div className="px-5 py-4 border-b border-white/10 bg-white/5 flex items-center gap-3">
        <div className="inline-flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-black/40">
          <Music2 className="h-5 w-5 text-amber-300" />
        </div>

        <div className="min-w-0">
          <div className="text-xs tracking-[0.22em] text-white/60">
            BUNS BEATS DECK
          </div>
          <div className="font-display text-lg text-white leading-tight truncate">
            {current?.title ?? "Beat"}
          </div>
          <div className="text-xs text-white/60 truncate">
            {current?.artist ? current.artist : "BUNS"}{" "}
            {current?.tag ? `· ${current.tag}` : ""}
          </div>
        </div>

        <div className="ml-auto inline-flex items-center gap-2">
          <button
            type="button"
            onClick={() => setLoop((p) => !p)}
            className={cx(
              "inline-flex items-center gap-2 rounded-2xl border px-3 py-2 text-xs transition",
              loop
                ? "border-buns-yellow/40 bg-buns-yellow/10 text-amber-100"
                : "border-white/10 bg-black/30 text-white/70 hover:bg-black/40"
            )}
            title={loop ? "Loop ON" : "Loop OFF"}
          >
            <Repeat className="h-4 w-4" />
            LOOP
          </button>
        </div>
      </div>

      {/* transport + scrub */}
      <div className="px-5 py-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={prev}
            className="inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-white/10 bg-black/30 text-white/70 hover:bg-black/40"
            title="Anterior"
          >
            <SkipBack className="h-5 w-5" />
          </button>

          <button
            type="button"
            onClick={toggle}
            className="inline-flex items-center justify-center h-11 w-14 rounded-2xl border border-buns-yellow/30 bg-buns-yellow/10 text-amber-100 hover:bg-buns-yellow/15"
            title={playing ? "Pausar" : "Tocar"}
          >
            {playing ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={next}
            className="inline-flex items-center justify-center h-11 w-11 rounded-2xl border border-white/10 bg-black/30 text-white/70 hover:bg-black/40"
            title="Seguinte"
          >
            <SkipForward className="h-5 w-5" />
          </button>

          <div className="flex-1 min-w-0">
            {/* scrub bar */}
            <div
              className="relative h-3 rounded-full border border-white/10 bg-black/30 overflow-hidden cursor-pointer"
              onClick={(e) => {
                const rect = (e.currentTarget as HTMLDivElement).getBoundingClientRect();
                const ratio = (e.clientX - rect.left) / rect.width;
                seekTo(ratio);
              }}
              title="Procurar"
            >
              <div
                className="absolute inset-y-0 left-0 bg-buns-yellow/40"
                style={{
                  width: dur ? `${Math.min(100, (cur / dur) * 100)}%` : "0%",
                }}
              />
              <div className="absolute inset-0 opacity-[0.12] bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.18)_50%,transparent_100%)] [background-size:100%_7px]" />
            </div>

            <div className="mt-2 flex items-center justify-between text-xs text-white/50">
              <span>{fmtTime(cur)}</span>
              <span>{ready ? fmtTime(dur) : "—:—"}</span>
            </div>
          </div>

          {/* volume */}
          <div className={cx("hidden sm:flex items-center gap-2", compact && "md:flex")}>
            <Volume2 className="h-4 w-4 text-white/60" />
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={vol}
              onChange={(e) => setVol(Number(e.target.value))}
              className="w-28 accent-[rgb(255,200,0)]"
              aria-label="Volume"
            />
          </div>
        </div>

        {/* tracklist */}
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {safeTracks.map((t, i) => (
            <button
              key={`${t.src}-${i}`}
              type="button"
              onClick={() => setIdx(i)}
              className={cx(
                "text-left rounded-2xl border px-4 py-3 transition",
                i === idx
                  ? "border-buns-yellow/40 bg-buns-yellow/10 text-amber-100"
                  : "border-white/10 bg-black/25 text-white/70 hover:bg-black/35"
              )}
              title="Selecionar faixa"
            >
              <div className="flex items-center gap-2">
                <span className="text-xs text-white/50">{String(i + 1).padStart(2, "0")}</span>
                <span className="font-semibold truncate">{t.title}</span>
              </div>
              <div className="mt-1 text-xs text-white/50 truncate">
                {t.artist ?? "BUNS"} {t.tag ? `· ${t.tag}` : ""}
              </div>
            </button>
          ))}
        </div>

        <audio ref={audioRef} preload="metadata" />
      </div>
    </section>
  );
}
