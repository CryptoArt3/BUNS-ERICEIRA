"use client";

import { motion } from "framer-motion";

const LEFT_MENU_ITEMS = [
  {
    title: "CLASSIC BUN MENU",
    price: "12.90€",
    ingredients: ["Ketchup", "Mustard", "Onion", "Pickles"],
  },
  {
    title: "EPIC BUN MENU",
    price: "13.90€",
    ingredients: ["Buns Special Sauce", "Caramelized Onion", "Jalapeños"],
  },
];

const RIGHT_MENU_ITEM = {
  title: "VEGGIE BUN MENU",
  price: "14.90€",
  ingredients: ["Buns Special Sauce", "120G Veggie Patty", "Onion", "Iceberg Lettuce"],
};

const CHICKEN_MENU_ITEM = {
  title: "CHICKEN BUN MENU",
  price: "13.90€",
  burgerOnly: "Burger only 9.90€",
  ingredients: [
    "Buns Special Sauce",
    "Caramelized Onion",
    "Iceberg Lettuce",
    "Pickles",
  ],
};

const SMASH_BURGER_BASE_NOTE = [
  "Brioche bun",
  "Double 70G beef patty",
  "Double American cheese",
];

const EXTRAS = ["Beef Patty +2€", "American Cheese +1€", "Bacon +2€"];
const SAUCES = ["Buns Special Sauce", "Garlic Mayo", "Spicy Mayo", "Smoky BBQ"];
const SIDES = ["Regular Fries 2.50€", "Sweet Potato Fries 2.50€"];
const DRINKS = ["Water 50CL 1.50€", "Soda 2.50€", "Beer 20CL/33CL 1.50€ / 2.00€"];

function SectionCard({
  title,
  accent = "gold",
  children,
  subtitle,
}: {
  title: string;
  accent?: "gold" | "cyan";
  subtitle?: string;
  children: React.ReactNode;
}) {
  const accentClasses =
    accent === "cyan"
      ? "border-[#00f0ff]/28 bg-[linear-gradient(180deg,rgba(0,240,255,0.12),rgba(0,0,0,0.7))] shadow-[0_0_24px_rgba(0,240,255,0.12),0_18px_42px_rgba(0,0,0,0.55)]"
      : "border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(0,0,0,0.7))] shadow-[0_18px_42px_rgba(0,0,0,0.55)]";

  const titleClasses = accent === "cyan" ? "text-[#00f0ff]" : "text-[#ffd166]";

  return (
    <div className={`rounded-[1.5rem] border px-5 py-4 ${accentClasses}`}>
      <p className={`font-body text-[0.72rem] font-black uppercase tracking-[0.34em] ${titleClasses}`}>
        {title}
      </p>
      {subtitle ? (
        <p className="mt-2 font-body text-[0.82rem] font-semibold uppercase tracking-[0.14em] text-white/72">
          {subtitle}
        </p>
      ) : null}
      <div className="mt-4">{children}</div>
    </div>
  );
}

function MenuList({ items }: { items: string[] }) {
  return (
    <div className="grid gap-2.5">
      {items.map((item) => (
        <div
          key={item}
          className="rounded-xl border border-white/8 bg-black/35 px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)]"
        >
          <p className="font-body text-[0.95rem] font-bold uppercase tracking-[0.1em] text-white">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function BunsMegaMenuSlide() {
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

      <section className="relative z-10 mx-auto grid min-h-dvh w-full max-w-[96rem] grid-rows-[auto_auto] gap-6 px-6 py-20 sm:px-8 xl:px-12">
        <div className="flex justify-center">
          <div className="rounded-full border border-[#ffd166]/24 bg-black/45 px-5 py-2.5 text-center backdrop-blur-sm">
            <p className="font-body text-[0.68rem] font-black uppercase tracking-[0.3em] text-[#ffd166]">
              Smash buns served with
            </p>
            <p className="mt-1 font-body text-[0.84rem] font-semibold uppercase tracking-[0.12em] text-white/86">
              {SMASH_BURGER_BASE_NOTE.join(" • ")}
            </p>
          </div>
        </div>

        <div className="grid min-h-0 gap-6 xl:grid-cols-[1.05fr_1.3fr_1.05fr]">
          <div className="grid gap-5 self-center">
            {LEFT_MENU_ITEMS.map((item) => (
              <SectionCard
                key={item.title}
                title={item.title}
                subtitle={item.price}
              >
                <MenuList items={item.ingredients} />
              </SectionCard>
            ))}
          </div>

          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            className="flex min-h-0 items-center justify-center"
          >
            <div className="w-full rounded-[2rem] border border-[#ffd166]/28 bg-[linear-gradient(180deg,rgba(255,209,102,0.14),rgba(0,0,0,0.72))] px-7 py-8 text-center shadow-[0_0_32px_rgba(255,209,102,0.12),0_28px_64px_rgba(0,0,0,0.62)]">
              <p className="font-body text-[0.82rem] font-black uppercase tracking-[0.42em] text-[#ffd166]">
                MOST ORDERED TODAY
              </p>
              <h1 className="mt-5 font-display text-[clamp(3.8rem,7.2vw,7.2rem)] font-black uppercase leading-[0.88] tracking-[0.05em] text-[#ffd166] [text-shadow:0_0_50px_rgba(255,209,102,0.4),0_10px_34px_rgba(0,0,0,0.8)]">
                BACON BUN MENU
              </h1>
              <div className="mt-7 rounded-[1.75rem] border border-[#ffd166]/26 bg-black/28 px-8 py-5 shadow-[inset_0_1px_0_rgba(255,209,102,0.08)]">
                <p className="font-display text-[clamp(4.8rem,9vw,8.8rem)] font-black leading-none text-white">
                  13.90€
                </p>
              </div>
              <p className="mt-6 rounded-full border border-[#00f0ff]/26 bg-[#00f0ff]/10 px-5 py-2 font-body text-[clamp(0.9rem,1.45vw,1.18rem)] font-black uppercase tracking-[0.18em] text-[#00f0ff]">
                INCLUDES FRIES + DRINK
              </p>
              <div className="mt-7 grid gap-3">
                <MenuList
                  items={[
                    "Buns Special Sauce",
                    "Crispy Onion",
                    "Crispy Bacon",
                    "Iceberg Lettuce",
                  ]}
                />
              </div>
            </div>
          </motion.div>

          <div className="grid gap-5 self-center">
            <SectionCard title={RIGHT_MENU_ITEM.title} subtitle={RIGHT_MENU_ITEM.price}>
              <MenuList items={RIGHT_MENU_ITEM.ingredients} />
            </SectionCard>
            <SectionCard title={CHICKEN_MENU_ITEM.title} subtitle={CHICKEN_MENU_ITEM.price}>
              <p className="mb-3 font-body text-[0.78rem] font-black uppercase tracking-[0.18em] text-[#00f0ff]">
                {CHICKEN_MENU_ITEM.burgerOnly}
              </p>
              <MenuList items={CHICKEN_MENU_ITEM.ingredients} />
            </SectionCard>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-[1fr_1.15fr_1fr_1.2fr_auto]">
          <SectionCard title="EXTRAS">
            <MenuList items={EXTRAS} />
          </SectionCard>

          <SectionCard title="DON'T EAT IT DRY" accent="cyan" subtitle="+1€ EACH">
            <MenuList items={SAUCES} />
          </SectionCard>

          <SectionCard title="SIDES">
            <MenuList items={SIDES} />
          </SectionCard>

          <SectionCard title="DRINKS">
            <MenuList items={DRINKS} />
          </SectionCard>

          <div className="rounded-[1.5rem] border border-[#ffd166]/28 bg-[linear-gradient(180deg,rgba(255,209,102,0.14),rgba(0,0,0,0.72))] px-5 py-4 text-center shadow-[0_0_24px_rgba(255,209,102,0.1),0_18px_42px_rgba(0,0,0,0.55)] xl:min-w-[14rem]">
            <p className="font-body text-[0.72rem] font-black uppercase tracking-[0.34em] text-[#ffd166]">
              DESSERT
            </p>
            <p className="mt-5 font-display text-[2rem] font-black uppercase leading-[0.95] text-white">
              FROZEN BUNANA
            </p>
            <p className="mt-4 font-display text-[3.25rem] font-black leading-none text-[#ffd166]">
              3.00€
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
