'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, useInView, AnimatePresence } from 'framer-motion'
import { Play, MapPin, Eye } from 'lucide-react'
import { useI18n } from '@/lib/i18n/useI18n'

// ── Static data ───────────────────────────────────────────────────────────────

function toWhatsapp(
  f: Record<string, string>,
  pkg: { name: string; price: string } | null,
) {
  const lines = [
    '🤝 BUNS & BUNANA — Pedido de Collab',
    '',
    ...(pkg ? [`PACOTE: ${pkg.name} — ${pkg.price}`, ''] : []),
    `NOME: ${f.nome}`,
    `NEGÓCIO: ${f.negocio}`,
    `INSTAGRAM: ${f.instagram}`,
    `TIPO DE SPOT: ${f.tipo}`,
    '',
    `IDEIA: ${f.mensagem}`,
    '',
    'Enviado através da página BUNS & BUNANA Collabs',
  ]
  return `https://wa.me/351913742086?text=${encodeURIComponent(lines.join('\n'))}`
}

const EPISODES = [
  { src: '/videos/buns-episode-04.mp4', title: 'Ouriço',               tag: '🤝 COLLAB',    loc: 'Ericeira', views: '22.4k' },
  { src: '/videos/buns-episode-13.mp4', title: 'Ribas',                tag: '📍 LOCAL',     loc: 'Ericeira', views: '35.1k' },
  { src: '/videos/buns-episode-14.mp4', title: 'Palácio de Mafra',     tag: '🏛 MONUMENTS', loc: 'Mafra',    views: '9.8k'  },
  { src: '/videos/buns-episode-10.mp4', title: 'Parque de Sta. Marta', tag: '⚽ SPORTS',    loc: 'Ericeira', views: '18.7k' },
  { src: '/videos/buns-episode-15.mp4', title: 'Algodio',              tag: '🏖 BEACH',     loc: 'Ericeira', views: '12.3k' },
  { src: '/videos/buns-episode-17.mp4', title: 'Forte',                tag: '🧗 AVENTURA',  loc: 'Ericeira', views: '14.2k' },
]

// ── Primitives ────────────────────────────────────────────────────────────────

function Reveal({
  children,
  delay = 0,
  className = '',
}: {
  children: React.ReactNode
  delay?: number
  className?: string
}) {
  const ref = useRef(null)
  const inView = useInView(ref, { once: true, margin: '-48px' })
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 22 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  )
}

function VideoCard({
  src,
  title,
  tag,
  views,
  loc,
}: {
  src: string
  title: string
  tag: string
  views: string
  loc: string
}) {
  const wrapRef  = useRef<HTMLDivElement>(null)
  const videoRef = useRef<HTMLVideoElement>(null)
  const inView   = useInView(wrapRef, { once: false, margin: '120px' })
  const [revealed, setRevealed] = useState(false)

  useEffect(() => { if (inView) setRevealed(true) }, [inView])

  useEffect(() => {
    const v = videoRef.current
    if (!v) return
    if (inView) v.play().catch(() => {})
    else v.pause()
  }, [inView])

  return (
    <motion.div
      ref={wrapRef}
      initial={{ opacity: 0, y: 22 }}
      animate={revealed ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="break-inside-avoid mb-3"
    >
      <motion.div
        whileHover={{
          scale: 1.025,
          boxShadow: '0 0 0 2.5px rgba(255,212,0,0.65), 0 8px 36px rgba(255,212,0,0.2)',
        }}
        transition={{ duration: 0.18, ease: 'easeOut' }}
        className="group relative rounded-3xl overflow-hidden cursor-pointer bg-black"
        style={{ height: 'clamp(195px, 40vw, 295px)' }}
      >
        <video
          ref={videoRef}
          src={src}
          muted
          loop
          playsInline
          preload="none"
          className="absolute inset-0 w-full h-full object-cover"
        />

        <div className="absolute inset-0 flex items-center justify-center z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center border border-white/20"
            style={{
              background: 'rgba(0,0,0,0.58)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            <Play className="w-5 h-5 text-white fill-white ml-0.5" />
          </div>
        </div>

        <div className="absolute top-2.5 left-2.5 z-10">
          <span
            className="text-[10px] font-black uppercase tracking-wide text-white/90 px-2 py-1 rounded-lg"
            style={{
              background: 'rgba(0,0,0,0.6)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {tag}
          </span>
        </div>

        <div className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1">
          <Eye className="w-3 h-3 text-white/50" />
          <span className="text-[10px] font-black text-white/50">{views}</span>
        </div>

        <div
          className="absolute bottom-0 inset-x-0 p-3 z-10"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.35) 65%, transparent 100%)' }}
        >
          <p className="font-black text-white text-[13px] leading-tight">{title}</p>
          <div className="flex items-center gap-1 mt-0.5">
            <MapPin className="w-2.5 h-2.5 text-buns-yellow shrink-0" />
            <span className="text-[10px] text-white/50 font-medium">{loc}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

export default function CollabsPage() {
  const { t } = useI18n()

  const [form, setForm] = useState({
    nome: '', negocio: '', instagram: '', tipo: '', mensagem: '',
  })
  const [sent, setSent]           = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [selectedPackage, setSelectedPackage] = useState<{ name: string; price: string } | null>(null)

  const STATS = [
    { value: '328K+', label: t('collabs.stats.views_label'),  sub: t('collabs.stats.views_sub')  },
    { value: '3900+', label: t('collabs.stats.shares_label'), sub: t('collabs.stats.shares_sub') },
    { value: '6500+', label: t('collabs.stats.inter_label'),  sub: t('collabs.stats.inter_sub')  },
    { value: 'LOCAL', label: t('collabs.stats.local_label'),  sub: t('collabs.stats.local_sub')  },
  ]

  const STEPS = [
    { n: '1', icon: '💬', title: t('collabs.steps.s1_title'), sub: t('collabs.steps.s1_sub') },
    { n: '2', icon: '🎬', title: t('collabs.steps.s2_title'), sub: t('collabs.steps.s2_sub') },
    { n: '3', icon: '🌋', title: t('collabs.steps.s3_title'), sub: t('collabs.steps.s3_sub') },
  ]

  const FORMATS = [
    {
      emoji: '🍌',
      name: 'QUICK DROP',
      price: '59€',
      subtitle: t('collabs.formats.f1_sub'),
      popular: false,
      cta: t('collabs.formats.f1_cta'),
      features: [
        t('collabs.formats.f1_feat1'),
        t('collabs.formats.f1_feat2'),
        t('collabs.formats.f1_feat3'),
        t('collabs.formats.f1_feat4'),
        t('collabs.formats.f1_feat5'),
      ],
    },
    {
      emoji: '🍔',
      name: 'CHAOS POST',
      price: '99€',
      subtitle: t('collabs.formats.f2_sub'),
      popular: true,
      cta: t('collabs.formats.f2_cta'),
      features: [
        t('collabs.formats.f2_feat1'),
        t('collabs.formats.f2_feat2'),
        t('collabs.formats.f2_feat3'),
        t('collabs.formats.f2_feat4'),
        t('collabs.formats.f2_feat5'),
        t('collabs.formats.f2_feat6'),
        t('collabs.formats.f2_feat7'),
      ],
    },
    {
      emoji: '🌋',
      name: 'CHAOS EPISODE',
      price: '150€',
      subtitle: t('collabs.formats.f3_sub'),
      popular: false,
      cta: t('collabs.formats.f3_cta'),
      features: [
        t('collabs.formats.f3_feat1'),
        t('collabs.formats.f3_feat2'),
        t('collabs.formats.f3_feat3'),
        t('collabs.formats.f3_feat4'),
        t('collabs.formats.f3_feat5'),
        t('collabs.formats.f3_feat6'),
        t('collabs.formats.f3_feat7'),
      ],
    },
  ]

  function selectPackage(name: string, price: string) {
    setSelectedPackage({ name, price })
    document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    // window.open must be called synchronously to avoid popup blockers
    window.open(toWhatsapp(form, selectedPackage), '_blank', 'noopener,noreferrer')
    setTimeout(() => {
      setSent(true)
      setSubmitting(false)
    }, 900)
  }

  return (
    <main className="w-full max-w-full overflow-x-hidden bg-black text-white">

      {/* ══════════════════════════════════════════════════
          1. HERO — cinematic fullscreen
      ══════════════════════════════════════════════════ */}
      <section className="relative min-h-[90svh] flex flex-col justify-end overflow-hidden bg-black">

        <video
          src="/videos/buns-episode-12.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{ filter: 'brightness(0.36) saturate(1.12)' }}
        />

        {/* Layered overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/74 via-black/10 to-black pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/58 via-transparent to-transparent pointer-events-none" />

        {/* Atmospheric yellow glow — bottom */}
        <div
          className="absolute bottom-0 left-1/3 pointer-events-none"
          style={{
            width: '600px',
            height: '500px',
            background: 'radial-gradient(circle, rgba(255,212,0,0.1) 0%, transparent 65%)',
            transform: 'translateY(42%)',
            filter: 'blur(52px)',
          }}
        />

        {/* Film grain */}
        <div
          className="absolute inset-0 pointer-events-none opacity-[0.038] mix-blend-overlay"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            backgroundSize: '180px 180px',
          }}
        />

        {/* Floating episode badge */}
        <motion.div
          animate={{ y: [0, -5, 0], rotate: [2, -1, 2] }}
          transition={{ duration: 5.5, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-5 right-5 z-10 hidden sm:block select-none pointer-events-none"
        >
          <span
            className="text-[10px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg"
            style={{
              background: 'rgba(255,212,0,0.1)',
              border: '1px solid rgba(255,212,0,0.22)',
              color: 'rgba(255,212,0,0.78)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          >
            {t('collabs.hero.ep_badge')}
          </span>
        </motion.div>

        {/* Hero content */}
        <div className="relative z-10 max-w-screen-xl mx-auto w-full px-5 sm:px-8 pb-14 pt-24">

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.08 }}
            className="inline-flex items-center gap-2 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-6"
          >
            🤝 BUNS & BUNANA — Collabs
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="font-display text-white uppercase leading-[0.9] tracking-tight"
            style={{ fontSize: 'clamp(2.7rem, 11.5vw, 7rem)' }}
          >
            {t('collabs.hero.h1_l1')}<br />
            {t('collabs.hero.h1_before')}<span className="text-buns-yellow">{t('collabs.hero.h1_color')}</span><br />
            {t('collabs.hero.h1_l3')}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.36 }}
            className="mt-5 text-white/50 text-[15px] sm:text-lg font-medium max-w-lg leading-relaxed"
          >
            {t('collabs.hero.sub')}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 flex flex-col sm:flex-row gap-3 max-w-xs sm:max-w-sm"
          >
            <a
              href="#contact"
              className="flex-1 py-4 bg-buns-yellow text-black font-black text-[13px] uppercase tracking-wide rounded-2xl text-center transition-all active:scale-[0.97] hover:brightness-105"
              style={{ boxShadow: '0 0 32px rgba(255,212,0,0.42)' }}
            >
              {t('collabs.hero.cta1')}
            </a>
            <a
              href="#reels"
              className="flex-1 py-4 text-white font-black text-[13px] uppercase tracking-wide rounded-2xl text-center transition-all active:scale-[0.97] border border-white/[0.18] hover:bg-white/[0.09]"
              style={{
                background: 'rgba(255,255,255,0.06)',
                backdropFilter: 'blur(10px)',
                WebkitBackdropFilter: 'blur(10px)',
              }}
            >
              {t('collabs.hero.cta2')}
            </a>
          </motion.div>
        </div>

        <div className="absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-black to-transparent pointer-events-none" />
      </section>

      {/* ══════════════════════════════════════════════════
          2. STATS — yellow strip
      ══════════════════════════════════════════════════ */}
      <section className="bg-buns-yellow border-y-4 border-black py-10 px-5">
        <div className="max-w-screen-xl mx-auto">

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 sm:gap-8">
            {STATS.map((s, i) => (
              <Reveal key={s.label} delay={i * 0.07}>
                <div className="text-center">
                  <p
                    className="font-display text-black uppercase leading-none"
                    style={{ fontSize: 'clamp(2rem, 7.5vw, 4rem)' }}
                  >
                    {s.value}
                  </p>
                  <p className="font-black text-black text-[11px] uppercase tracking-widest mt-1.5 leading-tight">
                    {s.label}
                  </p>
                  <p className="text-black/50 text-[11px] mt-1 leading-snug">{s.sub}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.3} className="mt-6 text-center">
            <p className="text-black/50 text-[12px] font-semibold">
              {t('collabs.stats.footer')}
            </p>
          </Reveal>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          3. EPISODE GRID — real video cards
      ══════════════════════════════════════════════════ */}
      <section id="reels" className="bg-black py-16 px-5">
        <div className="max-w-screen-xl mx-auto">

          <Reveal className="mb-8">
            <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-4">
              {t('collabs.reels.badge')}
            </div>
            <p
              className="font-display text-white uppercase leading-[0.91]"
              style={{ fontSize: 'clamp(1.8rem, 7.5vw, 4rem)' }}
            >
              {t('collabs.reels.h2_l1')}<br />
              <span className="text-buns-yellow">{t('collabs.reels.h2_l2')}</span>
            </p>
          </Reveal>

          <div className="columns-2 md:columns-3 gap-3">
            {EPISODES.map((ep) => (
              <VideoCard key={ep.src} {...ep} />
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          4. HOW IT WORKS — cream section
      ══════════════════════════════════════════════════ */}
      <section className="bg-buns-cream border-t-4 border-black py-16 px-5">
        <div className="max-w-screen-xl mx-auto">

          <Reveal className="mb-8">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-black/35 mb-2">
              {t('collabs.hiw.eyebrow')}
            </p>
            <p
              className="font-display text-black uppercase leading-[0.91]"
              style={{ fontSize: 'clamp(1.8rem, 7.5vw, 4rem)' }}
            >
              {t('collabs.hiw.h2')}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {STEPS.map((step, i) => (
              <Reveal key={step.n} delay={i * 0.1}>
                <div className="bg-white border-2 border-black/8 rounded-2xl p-6 text-center relative overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-black text-buns-yellow font-black text-lg flex items-center justify-center mx-auto mb-3">
                    {step.n}
                  </div>
                  <span className="text-3xl block mb-3" aria-hidden="true">{step.icon}</span>
                  <p className="font-black text-black text-[14px] uppercase tracking-wide leading-tight mb-2">
                    {step.title}
                  </p>
                  <p className="text-black/50 text-[13px] leading-relaxed">{step.sub}</p>
                  <span
                    className="absolute -bottom-3 right-2 font-display text-black/[0.04] leading-none select-none pointer-events-none"
                    style={{ fontSize: '5.5rem' }}
                    aria-hidden="true"
                  >
                    {step.n}
                  </span>
                </div>
              </Reveal>
            ))}
          </div>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          5. FORMATOS
      ══════════════════════════════════════════════════ */}
      <section className="bg-black border-t-4 border-buns-yellow py-16 px-5">
        <div className="max-w-screen-xl mx-auto">

          <Reveal className="mb-2">
            <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-4">
              {t('collabs.formats.badge')}
            </div>
            <p
              className="font-display text-white uppercase leading-[0.91]"
              style={{ fontSize: 'clamp(1.8rem, 7.5vw, 4rem)' }}
            >
              {t('collabs.formats.h2')}
            </p>
          </Reveal>

          <Reveal delay={0.06} className="mb-10">
            <p className="text-white/35 text-[13px] font-medium">
              {t('collabs.formats.sub')}
            </p>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {FORMATS.map((f, i) => (
              <Reveal key={f.name} delay={i * 0.1}>
                <div
                  className={[
                    'relative rounded-2xl p-5 sm:p-6 border flex flex-col h-full',
                    f.popular ? 'border-buns-yellow' : 'border-white/[0.08]',
                  ].join(' ')}
                  style={{
                    background: f.popular ? 'rgba(255,212,0,0.05)' : 'rgba(255,255,255,0.025)',
                    boxShadow: f.popular ? '0 0 48px rgba(255,212,0,0.1)' : 'none',
                  }}
                >
                  {f.popular && (
                    <div className="absolute top-4 right-4">
                      <span className="text-[9px] font-black uppercase tracking-widest bg-buns-yellow text-black px-2.5 py-1 rounded-full">
                        POPULAR
                      </span>
                    </div>
                  )}

                  <span className="text-3xl mb-3 block" aria-hidden="true">{f.emoji}</span>

                  <p className="font-display text-white uppercase leading-none text-xl sm:text-2xl mb-1">
                    {f.name}
                  </p>
                  <p className="text-white/50 text-[12px] font-medium leading-snug mb-3">
                    {f.subtitle}
                  </p>
                  <p
                    className={`font-display text-3xl sm:text-4xl uppercase leading-none mb-5 ${f.popular ? 'text-buns-yellow' : 'text-white'}`}
                  >
                    {f.price}
                  </p>

                  <ul className="space-y-3 mb-6 flex-1">
                    {f.features.map((feat) => (
                      <li key={feat} className="flex items-start gap-2.5 text-[13px]">
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-[5px] shrink-0 ${f.popular ? 'bg-buns-yellow' : 'bg-white/25'}`}
                        />
                        <span className="text-white/78 leading-snug">{feat}</span>
                      </li>
                    ))}
                  </ul>

                  <button
                    type="button"
                    onClick={() => selectPackage(f.name, f.price)}
                    className={[
                      'block w-full py-3.5 rounded-xl font-black text-[12px] uppercase tracking-wide text-center transition-all active:scale-[0.97]',
                      f.popular
                        ? 'bg-buns-yellow text-black hover:brightness-105'
                        : 'text-white border border-white/[0.1] hover:bg-white/[0.08]',
                    ].join(' ')}
                    style={f.popular ? undefined : { background: 'rgba(255,255,255,0.05)' }}
                  >
                    {f.cta}
                  </button>
                </div>
              </Reveal>
            ))}
          </div>

          {/* Curation note */}
          <Reveal delay={0.18} className="mt-5">
            <div
              className="rounded-2xl p-4 sm:p-5 border border-white/[0.06] flex items-start gap-3"
              style={{ background: 'rgba(255,255,255,0.02)' }}
            >
              <span className="text-xl shrink-0" aria-label="Atenção">⚠️</span>
              <div>
                <p className="text-white/78 text-[13px] font-semibold leading-snug">
                  {t('collabs.formats.note_main')}
                </p>
                <p className="text-white/30 text-[11px] mt-1.5">
                  {t('collabs.formats.note_sub')}
                </p>
              </div>
            </div>
          </Reveal>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          6. LOCAL CULTURE — cinematic quote
      ══════════════════════════════════════════════════ */}
      <section className="relative bg-black py-20 px-5 overflow-hidden border-t border-white/[0.04]">

        {/* Radial yellow glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 55% 50%, rgba(255,212,0,0.07) 0%, transparent 60%)',
          }}
        />

        <div className="relative z-10 max-w-2xl mx-auto text-center">

          <Reveal>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/22 mb-6">
              {t('collabs.cult.eyebrow')}
            </p>
            <p
              className="font-display text-white uppercase leading-[0.9] tracking-tight"
              style={{ fontSize: 'clamp(2.2rem, 9vw, 5.2rem)' }}
            >
              {t('collabs.cult.h2_l1')}<br />{t('collabs.cult.h2_l2')}<br />
              <span className="text-buns-yellow">{t('collabs.cult.h2_l3')}</span>
            </p>
          </Reveal>

          <Reveal delay={0.15} className="mt-6">
            <p className="text-white/45 text-[15px] sm:text-lg font-medium leading-relaxed">
              {t('collabs.cult.sub')}
            </p>
          </Reveal>

          <Reveal delay={0.25} className="mt-8">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {[
                t('collabs.cult.tag1'),
                t('collabs.cult.tag2'),
                t('collabs.cult.tag3'),
                t('collabs.cult.tag4'),
              ].map((tag) => (
                <span
                  key={tag}
                  className="text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/[0.1] text-white/42"
                  style={{ background: 'rgba(255,255,255,0.04)' }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </Reveal>

        </div>
      </section>

      {/* ══════════════════════════════════════════════════
          7. CONTACT FORM
      ══════════════════════════════════════════════════ */}
      <section id="contact" className="bg-black border-t border-white/[0.06] py-16 px-5">
        <div className="max-w-lg mx-auto">

          <Reveal className="mb-8">
            <div className="inline-flex items-center gap-1.5 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-4">
              {t('collabs.contact.badge')}
            </div>
            <p
              className="font-display text-white uppercase leading-[0.91]"
              style={{ fontSize: 'clamp(1.8rem, 7.5vw, 4rem)' }}
            >
              {t('collabs.contact.h2_l1')}<br /><span className="text-buns-yellow">{t('collabs.contact.h2_l2')}</span>
            </p>
            <p className="text-white/35 text-[13px] font-medium mt-3 leading-snug">
              {t('collabs.contact.sub')}
            </p>
          </Reveal>

          {/* Selected package badge */}
          <AnimatePresence>
            {selectedPackage && !sent && (
              <motion.div
                key="pkg-badge"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
                className="mb-5 flex items-center justify-between gap-3 px-4 py-3 rounded-xl border border-buns-yellow/25"
                style={{ background: 'rgba(255,212,0,0.06)' }}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/35 shrink-0">
                    {t('collabs.contact.pkg_label')}
                  </span>
                  <span className="text-buns-yellow font-black text-[13px] uppercase truncate">
                    {selectedPackage.name} — {selectedPackage.price}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedPackage(null)}
                  aria-label="Remover seleção"
                  className="shrink-0 text-white/25 hover:text-white/60 transition text-lg leading-none"
                >
                  ×
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.94, y: 12 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-2xl p-8 sm:p-10 text-center border border-buns-yellow/25"
                style={{
                  background: 'rgba(255,212,0,0.04)',
                  boxShadow: '0 0 52px rgba(255,212,0,0.09)',
                }}
              >
                <motion.span
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.14, duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
                  className="text-5xl block mb-5"
                  role="img"
                  aria-label="Vulcão"
                >
                  🌋
                </motion.span>
                <p className="font-display text-buns-yellow text-2xl sm:text-3xl uppercase leading-none mb-3">
                  {t('collabs.contact.success_title')}
                </p>
                <p className="text-white/48 text-[14px] leading-relaxed">
                  {t('collabs.contact.success_body1')}<br />
                  {t('collabs.contact.success_body2')}
                </p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-6 text-[11px] font-black uppercase tracking-widest text-white/25 hover:text-white/55 transition"
                >
                  {t('collabs.contact.send_another')}
                </button>
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                className="space-y-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {(
                  [
                    { field: 'nome' as const,      label: t('collabs.contact.f_nome'),    placeholder: t('collabs.contact.f_nome_ph')    },
                    { field: 'negocio' as const,   label: t('collabs.contact.f_negocio'), placeholder: t('collabs.contact.f_negocio_ph') },
                    { field: 'instagram' as const, label: t('collabs.contact.f_ig'),      placeholder: t('collabs.contact.f_ig_ph')      },
                    { field: 'tipo' as const,      label: t('collabs.contact.f_tipo'),    placeholder: t('collabs.contact.f_tipo_ph')    },
                  ]
                ).map(({ field, label, placeholder }) => (
                  <div key={field}>
                    <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-1.5">
                      {label}
                    </label>
                    <input
                      type="text"
                      placeholder={placeholder}
                      value={form[field]}
                      onChange={(e) => setForm((s) => ({ ...s, [field]: e.target.value }))}
                      required
                      className="w-full rounded-xl px-4 py-3.5 text-white text-[14px] placeholder:text-white/18 outline-none transition-all border border-white/[0.07] focus:border-buns-yellow/50 focus:ring-1 focus:ring-buns-yellow/15"
                      style={{ background: 'rgba(255,255,255,0.04)' }}
                    />
                  </div>
                ))}

                <div>
                  <label className="block text-[10px] font-black uppercase tracking-[0.18em] text-white/30 mb-1.5">
                    {t('collabs.contact.f_msg')}
                  </label>
                  <textarea
                    placeholder={t('collabs.contact.f_msg_ph')}
                    value={form.mensagem}
                    onChange={(e) => setForm((s) => ({ ...s, mensagem: e.target.value }))}
                    required
                    rows={4}
                    className="w-full rounded-xl px-4 py-3.5 text-white text-[14px] placeholder:text-white/18 outline-none resize-none transition-all border border-white/[0.07] focus:border-buns-yellow/50 focus:ring-1 focus:ring-buns-yellow/15"
                    style={{ background: 'rgba(255,255,255,0.04)' }}
                  />
                </div>

                <motion.button
                  type="submit"
                  disabled={submitting}
                  animate={submitting ? { scale: [1, 0.98, 1] } : {}}
                  transition={{ duration: 0.2 }}
                  className="w-full py-4 bg-buns-yellow text-black font-black text-[13px] uppercase tracking-wide rounded-2xl transition-all active:scale-[0.97] hover:brightness-105 mt-1 disabled:pointer-events-none"
                  style={{ boxShadow: '0 0 32px rgba(255,212,0,0.32)' }}
                >
                  {submitting ? t('collabs.contact.submitting') : t('collabs.contact.submit')}
                </motion.button>

                <p className="text-white/22 text-[11px] text-center font-medium pt-1">
                  {t('collabs.contact.helper')}
                </p>
              </motion.form>
            )}
          </AnimatePresence>

        </div>
      </section>

      {/* Safe-area spacer — mobile nav bar */}
      <div className="h-20 md:h-0 bg-black" />

    </main>
  )
}
