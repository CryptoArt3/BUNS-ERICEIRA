"use client";

import { motion } from "framer-motion";

type GoldBunHeroSlideProps = {
  videoSrc?: string | null;
  onVideoEnded?: () => void;
};

export default function GoldBunHeroSlide({ videoSrc, onVideoEnded }: GoldBunHeroSlideProps) {
  return (
    <div className="relative h-dvh w-full overflow-hidden bg-black">
      {videoSrc ? (
        <motion.video
          key={videoSrc}
          src={videoSrc}
          poster="/campaigns/gold-bun-2026.png"
          muted
          playsInline
          autoPlay
          preload="auto"
          onEnded={onVideoEnded}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{
            opacity: { duration: 1.2, ease: "easeOut" },
          }}
          className="h-full w-full object-contain"
        />
      ) : (
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
      )}
      <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.12),transparent_25%,transparent_70%,rgba(0,0,0,0.25))]" />
    </div>
  );
}
