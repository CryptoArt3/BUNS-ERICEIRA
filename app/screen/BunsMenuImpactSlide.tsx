"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";

type MenuImpactSlide = {
  id: string;
  eyebrow: string;
  title: string;
  price?: string;
  kicker?: string;
  menuIncludes?: string;
  burgerOnly?: string;
  lines?: string[];
  emphasis?: string;
  mode?: "hero" | "ingredients" | "upsell";
  accent: "gold" | "cyan";
  durationMs: number;
};

const MENU_IMPACT_SLIDES: MenuImpactSlide[] = [
  {
    id: "classic",
    eyebrow: "BEST VALUE MENU",
    title: "CLASSIC BUN MENU",
    price: "12.90€",
    kicker: "THE ONE YOU ALWAYS COME BACK TO",
    menuIncludes: "INCLUDES FRIES + DRINK",
    burgerOnly: "burger only 8.90€",
    mode: "hero",
    accent: "gold",
    durationMs: 7000,
  },
  {
    id: "classic-ingredients",
    eyebrow: "WHAT'S INSIDE",
    title: "CLASSIC BUN",
    lines: ["Ketchup", "Mustard", "Onion", "Pickles"],
    emphasis: "THE CLEAN CLASSIC HIT",
    mode: "ingredients",
    accent: "gold",
    durationMs: 6500,
  },
  {
    id: "bacon",
    eyebrow: "MOST ORDERED TODAY",
    title: "BACON BUN MENU",
    price: "13.90€",
    kicker: "CRISPY. SALTY. ADDICTIVE.",
    menuIncludes: "INCLUDES FRIES + DRINK",
    burgerOnly: "burger only 9.90€",
    mode: "hero",
    accent: "gold",
    durationMs: 7000,
  },
  {
    id: "bacon-ingredients",
    eyebrow: "WHAT'S INSIDE",
    title: "BACON BUN",
    lines: ["Buns Special Sauce", "Crispy Onion", "Crispy Bacon", "Iceberg Lettuce"],
    emphasis: "SAVAGE CRUNCH IN EVERY BITE",
    mode: "ingredients",
    accent: "gold",
    durationMs: 6500,
  },
  {
    id: "epic",
    eyebrow: "FOR THE BOLD ONES",
    title: "EPIC BUN MENU",
    price: "13.90€",
    kicker: "NOT FOR EVERYONE",
    menuIncludes: "INCLUDES FRIES + DRINK",
    burgerOnly: "burger only 9.90€",
    mode: "hero",
    accent: "gold",
    durationMs: 7000,
  },
  {
    id: "epic-ingredients",
    eyebrow: "WHAT'S INSIDE",
    title: "EPIC BUN",
    lines: ["Buns Special Sauce", "Caramelized Onion", "Jalapeños"],
    emphasis: "SWEET HEAT. NO APOLOGIES.",
    mode: "ingredients",
    accent: "gold",
    durationMs: 6500,
  },
  {
    id: "veggie",
    eyebrow: "PLANT POWER MENU",
    title: "VEGGIE BUN MENU",
    price: "14.90€",
    kicker: "PLANT. BUT MAKE IT DIRTY.",
    menuIncludes: "INCLUDES FRIES + DRINK",
    burgerOnly: "burger only 10.90€",
    mode: "hero",
    accent: "gold",
    durationMs: 7000,
  },
  {
    id: "veggie-ingredients",
    eyebrow: "WHAT'S INSIDE",
    title: "VEGGIE BUN",
    lines: ["Buns Special Sauce", "Beyond Meat", "Onion", "Iceberg Lettuce"],
    emphasis: "PLANT, LOUD AND SATISFYING",
    mode: "ingredients",
    accent: "gold",
    durationMs: 6500,
  },
  {
    id: "sauces",
    eyebrow: "SAUCE UPGRADE",
    title: "SAUCES THAT HIT DIFFERENT",
    lines: ["Buns Special Sauce", "Garlic Mayo", "Spicy Mayo", "Smoky BBQ"],
    price: "+1€ EACH",
    emphasis: "DON'T EAT IT DRY",
    mode: "upsell",
    accent: "cyan",
    durationMs: 7000,
  },
  {
    id: "extras",
    eyebrow: "Power Up",
    title: "MAKE IT YOURS",
    lines: ["Beef Patty +2€", "Bacon +2€", "American Cheese +1€"],
    emphasis: "GO BIG OR GO HOME",
    mode: "upsell",
    accent: "cyan",
    durationMs: 7000,
  },
  {
    id: "sides",
    eyebrow: "Add The Crunch",
    title: "SIDES",
    lines: ["Regular Fries 2.50€", "Sweet Potato Fries 2.50€"],
    accent: "cyan",
    durationMs: 6500,
  },
  {
    id: "drinks",
    eyebrow: "Pair It Right",
    title: "DRINKS",
    lines: ["Water 50CL 1.50€", "Soda 2.50€", "Beer 20CL/33CL 1.50€ / 2.00€"],
    accent: "cyan",
    durationMs: 6500,
  },
  {
    id: "dessert",
    eyebrow: "Closer",
    title: "FROZEN BUNANA",
    price: "3.00€",
    kicker: "YOU'LL REGRET NOT TRYING THIS.",
    accent: "gold",
    durationMs: 7000,
  },
];

export default function BunsMenuImpactSlide() {
  const [index, setIndex] = useState(0);

  const currentSlide = useMemo(
    () => MENU_IMPACT_SLIDES[index] ?? MENU_IMPACT_SLIDES[0],
    [index]
  );

  useEffect(() => {
    const timeout = window.setTimeout(() => {
      setIndex((current) => (current + 1) % MENU_IMPACT_SLIDES.length);
    }, currentSlide.durationMs);

    return () => window.clearTimeout(timeout);
  }, [currentSlide.durationMs, currentSlide.id]);

  const isGold = currentSlide.accent === "gold";
  const slideMode = currentSlide.mode ?? "hero";
  const isIngredientsSlide = slideMode === "ingredients";
  const isUpsellSlide = slideMode === "upsell";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#040303] text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,209,102,0.18),transparent_28%),radial-gradient(circle_at_bottom,rgba(0,240,255,0.08),transparent_34%),linear-gradient(180deg,#050404_0%,#090603_46%,#020201_100%)]" />
      <div className="absolute inset-0 opacity-[0.12] [background-image:linear-gradient(rgba(255,209,102,0.18)_1px,transparent_1px),linear-gradient(90deg,rgba(255,209,102,0.12)_1px,transparent_1px)] [background-size:32px_32px]" />

      <AnimatePresence mode="wait">
        <motion.div
          key={currentSlide.id}
          initial={{ opacity: 0, scale: 0.985 }}
          animate={{ opacity: 1, scale: 1.035 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_18%,rgba(255,209,102,0.22),transparent_24%),radial-gradient(circle_at_80%_78%,rgba(0,240,255,0.1),transparent_28%),linear-gradient(135deg,rgba(255,255,255,0.02),transparent_55%)]" />
        </motion.div>
      </AnimatePresence>

      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.16),rgba(0,0,0,0.44)_40%,rgba(0,0,0,0.68)_72%,rgba(0,0,0,0.84))]" />

      <div className="absolute left-6 top-6 z-10 sm:left-10 sm:top-10">
        <div className="rounded-full border border-[#ffd166]/40 bg-black/45 px-4 py-2 backdrop-blur-sm">
          <span className="font-body text-[0.7rem] font-black uppercase tracking-[0.34em] text-[#ffd166]">
            MENU IMPACT
          </span>
        </div>
      </div>

      <section className="relative z-10 flex min-h-dvh w-full items-center justify-center px-8 py-14 sm:px-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide.id}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.85, ease: "easeOut" }}
            className="mx-auto flex w-full max-w-[56rem] flex-col items-center text-center"
          >
            <p
              className={`font-body text-[clamp(0.72rem,1.6vw,0.95rem)] font-black uppercase tracking-[0.44em] ${
                isGold ? "text-[#ffd166]" : "text-[#00f0ff]"
              }`}
            >
              {currentSlide.eyebrow}
            </p>

            <h1
              className={`mt-5 font-display font-black uppercase leading-[0.88] tracking-[0.06em] text-[#ffd166] [text-shadow:0_0_50px_rgba(255,209,102,0.4),0_10px_34px_rgba(0,0,0,0.8)] ${
                isIngredientsSlide
                  ? "max-w-[14ch] text-[clamp(2.8rem,7vw,5.8rem)]"
                  : "max-w-[16ch] text-[clamp(3.4rem,8.8vw,7rem)]"
              }`}
            >
              {currentSlide.title}
            </h1>

            {currentSlide.price ? (
              <div
                className={`mt-8 rounded-[1.6rem] px-8 py-5 shadow-[0_0_28px_rgba(255,209,102,0.16),0_18px_44px_rgba(0,0,0,0.55)] ${
                  isUpsellSlide
                    ? "border border-[#00f0ff]/28 bg-[linear-gradient(180deg,rgba(0,240,255,0.12),rgba(0,0,0,0.56))]"
                    : "border border-[#ffd166]/28 bg-[linear-gradient(180deg,rgba(255,209,102,0.12),rgba(0,0,0,0.56))]"
                }`}
              >
                <p className="font-display text-[clamp(4.1rem,12vw,8.2rem)] font-black leading-none text-white">
                  {currentSlide.price}
                </p>
              </div>
            ) : null}

            {currentSlide.kicker ? (
              <p className="mt-6 max-w-[24ch] font-body text-[clamp(1rem,2.25vw,1.5rem)] font-bold uppercase tracking-[0.16em] text-white">
                {currentSlide.kicker}
              </p>
            ) : null}

            {currentSlide.menuIncludes ? (
              <p className="mt-5 rounded-full border border-[#00f0ff]/28 bg-[#00f0ff]/10 px-5 py-2 font-body text-[clamp(0.9rem,1.8vw,1.2rem)] font-black uppercase tracking-[0.18em] text-[#00f0ff]">
                {currentSlide.menuIncludes}
              </p>
            ) : null}

            {currentSlide.burgerOnly ? (
              <p className="mt-4 font-body text-[clamp(0.86rem,1.7vw,1.05rem)] font-semibold uppercase tracking-[0.24em] text-white/55">
                {currentSlide.burgerOnly}
              </p>
            ) : null}

            {currentSlide.lines?.length ? (
              <div
                className={`mt-8 grid w-full gap-3 ${
                  isIngredientsSlide ? "max-w-[40rem] md:grid-cols-2" : "max-w-[34rem]"
                }`}
              >
                {currentSlide.lines.map((line) => (
                  <div
                    key={line}
                    className={`rounded-2xl px-6 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${
                      isIngredientsSlide
                        ? "border border-[#ffd166]/14 bg-[linear-gradient(180deg,rgba(255,209,102,0.08),rgba(0,0,0,0.52))]"
                        : "border border-white/8 bg-black/50"
                    }`}
                  >
                    <p
                      className={`font-body font-black uppercase tracking-[0.14em] text-white ${
                        isIngredientsSlide
                          ? "text-[clamp(1rem,2.3vw,1.45rem)]"
                          : "text-[clamp(1.1rem,2.7vw,1.8rem)]"
                      }`}
                    >
                      {line}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {currentSlide.emphasis ? (
              <p className="mt-6 font-body text-[clamp(1rem,2.1vw,1.35rem)] font-black uppercase tracking-[0.24em] text-[#ffd166]">
                {currentSlide.emphasis}
              </p>
            ) : null}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
