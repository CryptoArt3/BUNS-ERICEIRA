"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type FrozenBunanaSlide = {
  id: string;
  eyebrow: string;
  title: string;
  price?: string;
  punchline?: string;
  lines?: string[];
  accent: "ice" | "gold";
  durationMs: number;
};

const HOOK_LINES = [
  "TOO HOT? GET FROZEN.",
  "COOL DOWN. LEVEL UP.",
  "AFTER BURGER? YOU KNOW THE MOVE.",
  "DON'T LEAVE WITHOUT THIS.",
  "TRY ME. I DARE YOU.",
];

const FROZEN_BUNANA_SLIDES: FrozenBunanaSlide[] = [
  {
    id: "classic-bun",
    eyebrow: "THE SAFE ADDICTION",
    title: "CLASSIC BUN",
    price: "3.00€",
    lines: [
      "Callebaut B823 milk chocolate",
      "Salted roasted peanut",
      "Creamy dulce de leche",
    ],
    accent: "gold",
    durationMs: 7000,
  },
  {
    id: "white-dream",
    eyebrow: "SWEET. SOFT. DANGEROUS.",
    title: "BUNS WHITE DREAM",
    price: "3.00€",
    lines: [
      "Callebaut W2 white chocolate",
      "Chopped pistachio",
      "Raspberry coulis",
    ],
    accent: "ice",
    durationMs: 7000,
  },
  {
    id: "dark-oreo",
    eyebrow: "CRUNCHY. CHOCOLATE. CHAOS.",
    title: "BUNS DARK OREO",
    price: "3.00€",
    lines: [
      "Callebaut B823 milk chocolate",
      "Crushed Oreo",
      "Hazelnut cream",
    ],
    accent: "ice",
    durationMs: 7000,
  },
  {
    id: "cookie-bomb",
    eyebrow: "THIS ONE SLAPS.",
    title: "BUNS COOKIE BOMB",
    price: "3.00€",
    lines: [
      "Callebaut W2 white chocolate",
      "Crushed Lotus biscuit",
      "Salted caramel",
    ],
    accent: "gold",
    durationMs: 7000,
  },
];

export default function BunsFrozenBunanasSlide() {
  const [index, setIndex] = useState(0);
  const [hookIndex, setHookIndex] = useState(0);

  const currentSlide = useMemo(
    () => FROZEN_BUNANA_SLIDES[index] ?? FROZEN_BUNANA_SLIDES[0],
    [index]
  );
  const currentHook = useMemo(
    () => HOOK_LINES[hookIndex] ?? HOOK_LINES[0],
    [hookIndex]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIndex((current) => (current + 1) % FROZEN_BUNANA_SLIDES.length);
    }, currentSlide.durationMs);

    return () => window.clearTimeout(timeout);
  }, [currentSlide.durationMs, currentSlide.id]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setHookIndex((current) => (current + 1) % HOOK_LINES.length);
    }, 2400);

    return () => window.clearInterval(interval);
  }, []);

  const accentClasses =
    currentSlide.accent === "ice"
      ? "text-[#8bf4ff]"
      : "text-[#ffd166]";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#041018] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(139,244,255,0.22),transparent_26%),radial-gradient(circle_at_bottom,rgba(92,164,255,0.12),transparent_32%),linear-gradient(180deg,#041018_0%,#071624_42%,#02070c_100%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(139,244,255,0.22)_1px,transparent_1px),linear-gradient(90deg,rgba(139,244,255,0.14)_1px,transparent_1px)] [background-size:24px_24px]" />
      <motion.div
        animate={{ y: [0, -6, 0], opacity: [0.88, 1, 0.9] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_18%,rgba(255,255,255,0.1),transparent_18%),radial-gradient(circle_at_75%_22%,rgba(139,244,255,0.12),transparent_20%),radial-gradient(circle_at_60%_78%,rgba(255,209,102,0.08),transparent_22%)]" />
      </motion.div>
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.08),rgba(0,0,0,0.28)_32%,rgba(0,0,0,0.58)_68%,rgba(0,0,0,0.82))]" />

      <div className="absolute left-6 top-6 z-10 sm:left-10 sm:top-10">
        <div className="rounded-full border border-[#8bf4ff]/38 bg-black/35 px-4 py-2 backdrop-blur-sm">
          <span className="font-body text-[0.7rem] font-black uppercase tracking-[0.34em] text-[#8bf4ff]">
            ICE MODE
          </span>
        </div>
      </div>

      <section className="relative z-10 flex min-h-dvh w-full items-center justify-center px-8 py-14 sm:px-12">
        <div className="mx-auto grid w-full max-w-[64rem] gap-8 text-center">
          <div className="flex flex-col items-center">
            <motion.p
              animate={{ opacity: [0.72, 1, 0.72] }}
              transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
              className="font-body text-[clamp(0.78rem,1.7vw,1rem)] font-black uppercase tracking-[0.42em] text-[#8bf4ff]"
            >
              FROZEN • FRESH • FUN
            </motion.p>
            <h1 className="mt-5 font-display text-[clamp(3.8rem,9vw,7.2rem)] font-black uppercase leading-[0.88] tracking-[0.06em] text-white [text-shadow:0_0_45px_rgba(139,244,255,0.28),0_10px_34px_rgba(0,0,0,0.8)]">
              FROZEN BUNANAS
            </h1>
            <p className="mt-5 font-display text-[clamp(3.4rem,8vw,6.2rem)] font-black leading-none text-[#ffd166] [text-shadow:0_0_36px_rgba(255,209,102,0.22)]">
              3.00€
            </p>
            <AnimatePresence mode="wait">
              <motion.p
                key={currentHook}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.45, ease: "easeOut" }}
                className="mt-6 max-w-[28ch] font-body text-[clamp(1rem,2.2vw,1.35rem)] font-black uppercase tracking-[0.16em] text-[#8bf4ff]"
              >
                {currentHook}
              </motion.p>
            </AnimatePresence>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentSlide.id}
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 1.02 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="mx-auto w-full max-w-[46rem] rounded-[2rem] border border-[#8bf4ff]/20 bg-[linear-gradient(180deg,rgba(139,244,255,0.09),rgba(0,0,0,0.6))] px-7 py-7 shadow-[0_0_28px_rgba(139,244,255,0.12),0_24px_56px_rgba(0,0,0,0.56)] backdrop-blur-sm"
            >
              <p className={`font-body text-[0.72rem] font-black uppercase tracking-[0.34em] ${accentClasses}`}>
                {currentSlide.eyebrow}
              </p>
              <h2 className="mt-4 font-display text-[clamp(2.7rem,6vw,4.9rem)] font-black uppercase leading-[0.9] tracking-[0.06em] text-white">
                {currentSlide.title}
              </h2>
              <div className="mt-5 inline-flex rounded-full border border-[#8bf4ff]/24 bg-[#8bf4ff]/10 px-5 py-2">
                <span className="font-body text-[0.95rem] font-black uppercase tracking-[0.18em] text-[#8bf4ff]">
                  {currentSlide.price}
                </span>
              </div>

              {currentSlide.lines?.length ? (
                <div className="mt-7 grid gap-3 md:grid-cols-3">
                  {currentSlide.lines.map((line) => (
                    <div
                      key={line}
                      className="rounded-2xl border border-white/8 bg-black/35 px-5 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
                    >
                      <p className="font-body text-[0.98rem] font-bold uppercase tracking-[0.1em] text-white">
                        {line}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}

              {currentSlide.punchline ? (
                <p className="mt-6 font-body text-[0.95rem] font-black uppercase tracking-[0.18em] text-[#ffd166]">
                  {currentSlide.punchline}
                </p>
              ) : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </section>
    </div>
  );
}
