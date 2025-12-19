"use client";

// app/freestyle/components/MCCard.tsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { MapPin, Swords, Trophy, Sparkles } from "lucide-react";
import type { MCCardModel } from "../data/mc.mock";
import { initialsFromAKA, styleLabel } from "../lib/mc";

type Rarity = "CLASSIC" | "RARE" | "EPIC" | "LEGENDARY";

function cx(...parts: Array<string | false | undefined | null>) {
  return parts.filter(Boolean).join(" ");
}

function toRarity(mc: any): Rarity {
  const r = String(mc?.rarity ?? mc?.card_rarity ?? "").toUpperCase();
  if (r === "CLASSIC" || r === "RARE" || r === "EPIC" || r === "LEGENDARY") return r;

  const t = String(mc?.tier ?? "").toUpperCase();
  if (t.includes("LEGEND")) return "LEGENDARY";
  if (t.includes("EPIC")) return "EPIC";
  if (t.includes("CHALLENG") || t.includes("RARE")) return "RARE";
  return "CLASSIC";
}

function rarityTheme(rarity: Rarity) {
  switch (rarity) {
    case "LEGENDARY":
      return {
        ring: "border-[#ffcc33]/75",
        glow:
          "shadow-[0_0_70px_rgba(255,204,51,0.30),0_0_0_1px_rgba(255,204,51,0.32)]",
        bg: "bg-[radial-gradient(circle_at_18%_10%,rgba(255,204,51,0.55),transparent_42%),radial-gradient(circle_at_84%_44%,rgba(255,120,0,0.28),transparent_60%),linear-gradient(180deg,rgba(255,255,255,0.08),rgba(0,0,0,0.52))]",
        badge:
          "border-[#ffcc33]/75 bg-[#ffcc33]/18 text-[#ffe7a1] shadow-[0_0_22px_rgba(255,204,51,0.18)]",
        accent: "text-[#ffcc33]",
        scan: "opacity-[0.20]",
        photoGlow:
          "shadow-[0_0_44px_rgba(255,204,51,0.22),0_0_0_1px_rgba(255,204,51,0.22)]",
      };
    case "EPIC":
      return {
        ring: "border-[#a855f7]/70",
        glow:
          "shadow-[0_0_66px_rgba(168,85,247,0.28),0_0_0_1px_rgba(168,85,247,0.26)]",
        bg: "bg-[radial-gradient(circle_at_20%_10%,rgba(168,85,247,0.52),transparent_44%),radial-gradient(circle_at_86%_48%,rgba(99,102,241,0.24),transparent_62%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(0,0,0,0.54))]",
        badge:
          "border-[#a855f7]/70 bg-[#a855f7]/16 text-[#f1ddff] shadow-[0_0_22px_rgba(168,85,247,0.16)]",
        accent: "text-[#d8b4fe]",
        scan: "opacity-[0.18]",
        photoGlow:
          "shadow-[0_0_40px_rgba(168,85,247,0.20),0_0_0_1px_rgba(168,85,247,0.20)]",
      };
    case "RARE":
      return {
        ring: "border-[#22d3ee]/70",
        glow:
          "shadow-[0_0_62px_rgba(34,211,238,0.26),0_0_0_1px_rgba(34,211,238,0.24)]",
        bg: "bg-[radial-gradient(circle_at_20%_10%,rgba(34,211,238,0.48),transparent_46%),radial-gradient(circle_at_86%_44%,rgba(59,130,246,0.22),transparent_64%),linear-gradient(180deg,rgba(255,255,255,0.06),rgba(0,0,0,0.54))]",
        badge:
          "border-[#22d3ee]/70 bg-[#22d3ee]/14 text-[#d6fbff] shadow-[0_0_22px_rgba(34,211,238,0.14)]",
        accent: "text-[#67e8f9]",
        scan: "opacity-[0.17]",
        photoGlow:
          "shadow-[0_0_38px_rgba(34,211,238,0.18),0_0_0_1px_rgba(34,211,238,0.18)]",
      };
    default:
      return {
        ring: "border-white/18",
        glow: "shadow-[0_0_0_1px_rgba(255,255,255,0.10)]",
        bg: "bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.14),transparent_56%),linear-gradient(180deg,rgba(255,255,255,0.07),rgba(0,0,0,0.58))]",
        badge: "border-white/18 bg-black/45 text-white/85",
        accent: "text-buns-yellow",
        scan: "opacity-[0.14]",
        photoGlow: "shadow-[0_0_0_1px_rgba(255,255,255,0.12)]",
      };
  }
}

export default function MCCard({ mc }: { mc: MCCardModel }) {
  const aka = (mc as any).aka ?? (mc as any).name ?? "MC";

  const battles = (mc as any).stats?.battles ?? (mc as any).battles ?? 0;
  const wins = (mc as any).stats?.wins ?? (mc as any).wins ?? 0;
  const finals = (mc as any).stats?.finals ?? (mc as any).finals ?? 0;

  const badges: string[] = Array.isArray((mc as any).badges) ? (mc as any).badges : [];

  const id = String((mc as any).id ?? "");

  // ✅ foto manual no mock (prioridade), com fallback automático
  const photo =
    (mc as any).photo ??
    (mc as any).photo_url ??
    (id ? `/freestyle/mcs/${id}.jpg` : null);

  const init = initialsFromAKA(aka);

  const rarity = toRarity(mc as any);
  const theme = rarityTheme(rarity);

  // Foto: só mostrar "PHOTO SLOT" se falhar
  const [imgOk, setImgOk] = useState(true);
  useEffect(() => {
    setImgOk(true);
  }, [photo]);

  // Tilt (mouse/touch)
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const tiltStyle = useMemo(() => {
    const rx = `${tilt.rx.toFixed(2)}deg`;
    const ry = `${tilt.ry.toFixed(2)}deg`;
    return {
      transform: `perspective(900px) rotateX(${rx}) rotateY(${ry}) translateZ(0)`,
    } as React.CSSProperties;
  }, [tilt]);

  function handlePointerMove(e: React.PointerEvent) {
    const el = cardRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    const max = 7;
    const ry = (x - 0.5) * max * 2;
    const rx = -(y - 0.5) * max * 2;

    setTilt({ rx, ry });
  }

  function resetTilt() {
    setTilt({ rx: 0, ry: 0 });
  }

  return (
    <div
      ref={cardRef}
      onPointerMove={handlePointerMove}
      onPointerLeave={resetTilt}
      onPointerUp={resetTilt}
      className={cx(
        "relative rounded-3xl overflow-hidden border",
        theme.ring,
        theme.glow,
        "transition will-change-transform",
        "hover:-translate-y-[2px] hover:scale-[1.01]"
      )}
      style={tiltStyle}
    >
      {/* Fundo por raridade */}
      <div className={cx("absolute inset-0", theme.bg)} aria-hidden />

      {/* Scanlines */}
      <div
        aria-hidden
        className={cx(
          "pointer-events-none absolute inset-0",
          theme.scan,
          "bg-[linear-gradient(to_bottom,transparent_0%,rgba(255,255,255,0.18)_50%,transparent_100%)] [background-size:100%_8px]"
        )}
      />

      {/* Conteúdo */}
      <div className="relative p-5">
        {/* Topo */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-semibold tracking-[0.2em] text-white/70">
              BUNS FREESTYLE • MC CARD
            </div>

            <div className="mt-1 font-display text-xl leading-tight text-white truncate">
              {aka}
            </div>

            <div className="mt-2 inline-flex items-center gap-2 text-sm text-white/85">
              <MapPin className={cx("h-4 w-4", theme.accent)} />
              {(mc as any).city ?? "—"}
            </div>
          </div>

          <span
            className={cx(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs",
              theme.badge
            )}
            title={`Raridade: ${rarity}`}
          >
            <Sparkles className={cx("h-3.5 w-3.5", theme.accent)} />
            <span className="font-semibold tracking-[0.14em]">{rarity}</span>
          </span>
        </div>

        {/* Layout sem sobreposição:
            - Mobile: FOTO grande em cima
            - Desktop: FOTO grande à direita
        */}
        <div className="mt-4 grid gap-4 lg:grid-cols-[72px_1fr_260px] lg:items-start">
          {/* FOTO (hero) */}
          <div
            className={cx(
              "relative rounded-2xl border border-white/12 bg-black/25 overflow-hidden",
              theme.photoGlow,
              "h-[170px] sm:h-[190px] lg:h-[210px]",
              "lg:col-start-3 lg:row-span-2"
            )}
          >
            {photo && imgOk ? (
              <img
                src={photo}
                alt={`${aka} photo`}
                className="absolute inset-0 h-full w-full object-cover opacity-95"
                loading="lazy"
                onLoad={() => setImgOk(true)}
                onError={() => setImgOk(false)}
              />
            ) : null}

            {/* overlay por raridade */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  rarity === "LEGENDARY"
                    ? "radial-gradient(circle_at_30%_25%, rgba(255,204,51,0.28), transparent 62%)"
                    : rarity === "EPIC"
                    ? "radial-gradient(circle_at_30%_25%, rgba(168,85,247,0.26), transparent 64%)"
                    : rarity === "RARE"
                    ? "radial-gradient(circle_at_30%_25%, rgba(34,211,238,0.24), transparent 66%)"
                    : "radial-gradient(circle_at_30%_25%, rgba(255,255,255,0.12), transparent 68%)",
              }}
            />

            <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/70 to-transparent" />

            {!photo || !imgOk ? (
              <div className="absolute inset-0 grid place-items-center text-[10px] tracking-[0.22em] text-white/45">
                PHOTO SLOT
              </div>
            ) : null}
          </div>

          {/* Avatar + Style */}
          <div className="flex items-center gap-4 lg:col-start-1">
            <div className="relative h-16 w-16 rounded-2xl border border-white/12 bg-black/40 grid place-items-center overflow-hidden">
              <div className={cx("font-display text-2xl relative z-10", theme.accent)}>
                {init}
              </div>
              <div
                aria-hidden
                className="absolute -inset-10 opacity-90"
                style={{
                  background:
                    rarity === "LEGENDARY"
                      ? "radial-gradient(circle, rgba(255,204,51,0.34), transparent 58%)"
                      : rarity === "EPIC"
                      ? "radial-gradient(circle, rgba(168,85,247,0.32), transparent 58%)"
                      : rarity === "RARE"
                      ? "radial-gradient(circle, rgba(34,211,238,0.30), transparent 58%)"
                      : "radial-gradient(circle, rgba(255,255,255,0.14), transparent 62%)",
                }}
              />
            </div>

            <div className="min-w-0 lg:col-start-2">
              <div className="text-xs text-white/60 tracking-[0.18em]">STYLE</div>
              <div className="mt-1 inline-flex items-center gap-2 rounded-full border border-white/12 bg-black/35 px-3 py-1 text-sm">
                <Swords className={cx("h-4 w-4", theme.accent)} />
                <span className={cx("font-semibold", theme.accent)}>
                  {styleLabel((mc as any).style)}
                </span>
              </div>

              <div className="mt-2 text-xs text-white/55">
                Carta ativa para seleção. A raridade sobe com performance e presença.
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-5 grid grid-cols-3 gap-2">
          <Stat label="BATTLES" value={battles} />
          <Stat label="WINS" value={wins} />
          <Stat label="FINALS" value={finals} />
        </div>

        {/* Badges */}
        <div className="mt-4 flex flex-wrap gap-2">
          {badges.slice(0, 4).map((b) => (
            <span
              key={b}
              className="rounded-full border border-white/12 bg-black/30 px-3 py-1 text-xs text-white/85"
            >
              {b}
            </span>
          ))}
        </div>

        <div className="mt-5 flex items-center justify-between text-xs text-white/60">
          <span className="inline-flex items-center gap-2">
            <Trophy className={cx("h-3.5 w-3.5", theme.accent)} />
            Arena Rank Ready
          </span>
          <span className="text-white/40">ID: {id}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border border-white/12 bg-black/30 p-3 text-center">
      <div className="text-[10px] tracking-[0.22em] text-white/55">{label}</div>
      <div className="mt-1 font-display text-lg text-white">{value}</div>
    </div>
  );
}
