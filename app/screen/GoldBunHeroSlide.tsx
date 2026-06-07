"use client";

import { motion } from "framer-motion";

export default function GoldBunHeroSlide() {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      <motion.img
        src="/campaigns/gold-bun-2026.png"
        alt="Gold Bun"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{
          opacity: { duration: 1.2, ease: "easeOut" },
        }}
        className="h-full w-full object-contain"
      />
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),transparent_25%,transparent_70%,rgba(0,0,0,0.25))]" />
    </div>
  );
}
