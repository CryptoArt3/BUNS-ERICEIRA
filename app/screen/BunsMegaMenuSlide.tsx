"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

const BURGER_CARDS = [
  {
    title: "CLASSIC BUN MENU",
    price: "12.90€",
    ingredients: "Ketchup • Mustard • Onion • Pickles",
    tone: "gold" as const,
  },
  {
    title: "EPIC BUN MENU",
    price: "13.90€",
    ingredients: "Buns Special Sauce • Caramelized Onion • Jalapeños",
    tone: "gold" as const,
  },
  {
    title: "VEGGIE BUN MENU",
    price: "14.90€",
    ingredients: "Buns Special Sauce • 120G Veggie Patty • Onion • Iceberg Lettuce",
    tone: "neutral" as const,
  },
  {
    title: "CHICKEN BUN MENU",
    price: "13.90€",
    subtitle: "Burger only 9.90€",
    ingredients: "Buns Special Sauce • Caramelized Onion • Iceberg Lettuce • Pickles",
    tone: "neutral" as const,
  },
];

const EXTRAS = ["Beef Patty +2€", "American Cheese +1€", "Bacon +2€"];
const SAUCES = ["Buns Special Sauce", "Garlic Mayo", "Spicy Mayo", "Smoky BBQ"];
const SIDES = ["Regular Fries 2.50€", "Sweet Potato Fries 2.50€"];
const DRINKS = ["Water 50CL 1.50€", "Soda 2.50€", "Beer 20CL/33CL 1.50€ / 2.00€"];

const INTERNAL_SLIDES = [
  { id: "burgers", durationMs: 10000 },
  { id: "extras", durationMs: 10000 },
] as const;

function CompactCard({
  title,
  price,
  ingredients,
  subtitle,
  tone = "neutral",
}: {
  title: string;
  price: string;
  ingredients: string;
  subtitle?: string;
  tone?: "gold" | "neutral";
}) {
  const toneClasses =
    tone === "gold"
      ? "border-[#ffd166]/24 bg-[linear-gradient(180deg,rgba(255,209,102,0.08),rgba(0,0,0,0.68))]"
      : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.68))]";

  return (
    <div className={`rounded-[1.2rem] border px-4 py-4 shadow-[0_14px_32px_rgba(0,0,0,0.4)] ${toneClasses}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 text-left">
          <p className="font-body text-[0.92rem] font-black uppercase tracking-[0.12em] text-white">
            {title}
          </p>
          {subtitle ? (
            <p className="mt-1 font-body text-[0.7rem] font-black uppercase tracking-[0.14em] text-[#00f0ff]">
              {subtitle}
            </p>
          ) : null}
        </div>
        <p className="shrink-0 font-display text-[1.5rem] font-black leading-none text-[#ffd166]">
          {price}
        </p>
      </div>
      <p className="mt-3 text-left font-body text-[0.8rem] font-semibold uppercase leading-[1.35] tracking-[0.08em] text-white/78">
        {ingredients}
      </p>
    </div>
  );
}

function LabelBlock({
  label,
  children,
  accent = "gold",
  sublabel,
}: {
  label: string;
  children: React.ReactNode;
  accent?: "gold" | "cyan";
  sublabel?: string;
}) {
  const labelColor = accent === "cyan" ? "text-[#8bf4ff]" : "text-[#ffd166]";
  const borderColor = accent === "cyan" ? "border-[#8bf4ff]/24" : "border-white/10";
  const background =
    accent === "cyan"
      ? "bg-[linear-gradient(180deg,rgba(139,244,255,0.1),rgba(0,0,0,0.72))]"
      : "bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.72))]";

  return (
    <div className={`rounded-[1.35rem] border px-4 py-4 shadow-[0_16px_36px_rgba(0,0,0,0.44)] ${borderColor} ${background}`}>
      <p className={`font-body text-[0.72rem] font-black uppercase tracking-[0.3em] ${labelColor}`}>
        {label}
      </p>
      {sublabel ? (
        <p className="mt-2 font-body text-[0.92rem] font-black uppercase tracking-[0.14em] text-white">
          {sublabel}
        </p>
      ) : null}
      <div className="mt-3">{children}</div>
    </div>
  );
}

function InlineList({ items, tone = "default" }: { items: string[]; tone?: "default" | "cyan" }) {
  return (
    <div className="flex flex-col gap-2">
      {items.map((item) => (
        <p
          key={item}
          className={`font-body text-[0.86rem] font-bold uppercase leading-[1.25] tracking-[0.08em] ${
            tone === "cyan" ? "text-white" : "text-white/88"
          }`}
        >
          {item}
        </p>
      ))}
    </div>
  );
}

function SauceGrid({ items }: { items: string[] }) {
  return (
    <div className="mt-1 grid grid-cols-2 gap-3">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-2xl border border-[#8bf4ff]/28 bg-[linear-gradient(180deg,rgba(139,244,255,0.14),rgba(0,0,0,0.56))] px-4 py-4 text-center shadow-[0_12px_28px_rgba(0,0,0,0.36),inset_0_1px_0_rgba(255,255,255,0.06)]"
        >
          <p className="font-body text-[0.95rem] font-black uppercase leading-[1.2] tracking-[0.08em] text-white">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function BunsMegaMenuSlide() {
  const [index, setIndex] = useState(0);

  const currentSlide = useMemo(
    () => INTERNAL_SLIDES[index] ?? INTERNAL_SLIDES[0],
    [index]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIndex((current) => (current + 1) % INTERNAL_SLIDES.length);
    }, currentSlide.durationMs);

    return () => window.clearTimeout(timeout);
  }, [currentSlide.durationMs, currentSlide.id]);

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#040303] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,209,102,0.18),transparent_26%),radial-gradient(circle_at_bottom,rgba(0,240,255,0.08),transparent_34%),linear-gradient(180deg,#050404_0%,#090603_48%,#020201_100%)]" />
      <div className="absolute inset-0 opacity-[0.1] [background-image:linear-gradient(rgba(255,209,102,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,209,102,0.12)_1px,transparent_1px)] [background-size:28px_28px]" />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),rgba(0,0,0,0.34)_34%,rgba(0,0,0,0.62)_68%,rgba(0,0,0,0.84))]" />

      <motion.div
        animate={{ opacity: [0.92, 1, 0.94] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        className="absolute inset-0"
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_24%_18%,rgba(255,209,102,0.16),transparent_26%),radial-gradient(circle_at_76%_24%,rgba(0,240,255,0.08),transparent_24%)]" />
      </motion.div>

      <div className="absolute left-6 top-6 z-10 sm:left-10 sm:top-10">
        <div className="rounded-full border border-[#ffd166]/40 bg-black/45 px-4 py-2 backdrop-blur-sm">
          <span className="font-body text-[0.7rem] font-black uppercase tracking-[0.34em] text-[#ffd166]">
            MEGA MENU
          </span>
        </div>
      </div>

      <div className="absolute right-6 top-6 z-10 sm:right-10 sm:top-10">
        <div className="rounded-full border border-white/10 bg-black/35 px-4 py-2 backdrop-blur-sm">
          <span className="font-body text-[0.68rem] font-black uppercase tracking-[0.28em] text-white/72">
            {index + 1} / {INTERNAL_SLIDES.length}
          </span>
        </div>
      </div>

      <section className="relative z-10 flex min-h-dvh w-full items-center justify-center px-5 py-16 sm:px-7 sm:py-18">
        <AnimatePresence mode="wait">
          {currentSlide.id === "burgers" ? (
            <motion.div
              key="burgers"
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 1.015 }}
              transition={{ duration: 0.75, ease: "easeInOut" }}
              className="mx-auto flex w-full max-w-[38rem] flex-col gap-4"
            >
              <div className="rounded-[1.8rem] border border-[#ffd166]/28 bg-[linear-gradient(180deg,rgba(255,209,102,0.14),rgba(0,0,0,0.72))] px-5 py-5 text-center shadow-[0_0_32px_rgba(255,209,102,0.12),0_24px_54px_rgba(0,0,0,0.58)]">
                <p className="font-body text-[0.72rem] font-black uppercase tracking-[0.34em] text-[#ffd166]">
                  MOST ORDERED TODAY
                </p>
                <h1 className="mt-4 font-display text-[clamp(2.9rem,7vw,5.25rem)] font-black uppercase leading-[0.88] tracking-[0.05em] text-[#ffd166] [text-shadow:0_0_46px_rgba(255,209,102,0.34),0_10px_30px_rgba(0,0,0,0.75)]">
                  BACON BUN MENU
                </h1>
                <p className="mt-4 font-display text-[clamp(3.6rem,8vw,6rem)] font-black leading-none text-white">
                  13.90€
                </p>
                <p className="mx-auto mt-4 inline-flex rounded-full border border-[#8bf4ff]/22 bg-[#8bf4ff]/10 px-4 py-2 font-body text-[0.82rem] font-black uppercase tracking-[0.16em] text-[#8bf4ff]">
                  INCLUDES FRIES + DRINK
                </p>
                <p className="mt-4 font-body text-[0.84rem] font-semibold uppercase leading-[1.35] tracking-[0.08em] text-white/84">
                  Buns Special Sauce • Crispy Onion • Crispy Bacon • Iceberg Lettuce
                </p>
              </div>

              <div className="rounded-[1.35rem] border border-[#ffd166]/20 bg-black/30 px-4 py-3 text-center shadow-[0_12px_28px_rgba(0,0,0,0.36)]">
                <p className="font-body text-[0.66rem] font-black uppercase tracking-[0.26em] text-[#ffd166]">
                  SMASH BUNS
                </p>
                <p className="mt-1 font-body text-[0.82rem] font-semibold uppercase leading-[1.35] tracking-[0.08em] text-white/84">
                  Brioche bun • Double 70G beef patty • Double American cheese
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {BURGER_CARDS.map((card) => (
                  <CompactCard
                    key={card.title}
                    title={card.title}
                    price={card.price}
                    ingredients={card.ingredients}
                    subtitle={card.subtitle}
                    tone={card.tone}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="extras"
              initial={{ opacity: 0, y: 18, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -18, scale: 1.015 }}
              transition={{ duration: 0.75, ease: "easeInOut" }}
              className="mx-auto flex w-full max-w-[38rem] -translate-y-[3.5vh] flex-col gap-3.5"
            >
              <LabelBlock
                label="DON'T EAT IT DRY"
                accent="cyan"
                sublabel="+1€ EACH"
              >
                <SauceGrid items={SAUCES} />
              </LabelBlock>

              <div className="grid gap-3 sm:grid-cols-2">
                <LabelBlock label="EXTRAS">
                  <InlineList items={EXTRAS} />
                </LabelBlock>
                <LabelBlock label="SIDES">
                  <InlineList items={SIDES} />
                </LabelBlock>
              </div>

              <div className="grid gap-3 sm:grid-cols-[1.35fr_0.9fr]">
                <LabelBlock label="DRINKS">
                  <InlineList items={DRINKS} />
                </LabelBlock>
                <LabelBlock label="DESSERT" accent="gold">
                  <p className="font-display text-[2.25rem] font-black uppercase leading-[0.92] text-white">
                    FROZEN BUNANA
                  </p>
                  <p className="mt-3 font-display text-[3.55rem] font-black leading-none text-[#ffd166]">
                    3.00€
                  </p>
                </LabelBlock>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </section>
    </div>
  );
}
