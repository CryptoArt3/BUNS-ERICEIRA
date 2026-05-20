'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import Script from 'next/script'

type MenuId = 'classic' | 'bacon' | 'epic' | 'veggie'

const MENUS: {
  id: MenuId
  name: string
  label: string
  subtitle: string
  ingredients: string[]
  modelSrc: string
  productSlug: string
  highlight?: string
}[] = [
  {
    id: 'classic',
    name: 'Classic Bun',
    label: 'CLASSIC',
    subtitle: 'O clássico da casa',
    ingredients: ['Ketchup', 'Mostarda', 'Cebola', 'Pickles'],
    modelSrc: '/ar-models/buns-classic-tray.glb',
    productSlug: 'classic-menu',
    highlight: 'Double smash',
  },
  {
    id: 'bacon',
    name: 'Bacon Bun',
    label: 'BACON',
    subtitle: 'O mais pedido da BUNS',
    ingredients: ['Molho especial', 'Cebola frita', 'Bacon', 'Alface'],
    modelSrc: '/ar-models/buns-bacon-tray.glb',
    productSlug: 'bacon-menu',
    highlight: 'Smash double + bacon',
  },
  {
    id: 'epic',
    name: 'Epic Bun',
    label: 'EPIC',
    subtitle: 'Nível máximo de smash',
    ingredients: ['Molho especial', 'Cebola caramelizada', 'Jalapeños'],
    modelSrc: '/ar-models/buns-epic-tray.glb',
    productSlug: 'epic-menu',
    highlight: 'Smash spicy',
  },
  {
    id: 'veggie',
    name: 'Veggie Bun',
    label: 'VEGGIE',
    subtitle: '100% plant based',
    ingredients: ['Molho especial', 'Carne Beyond Meat', 'Cebola', 'Alface'],
    modelSrc: '/ar-models/buns-veggie-tray.glb',
    productSlug: 'veggie-menu',
    highlight: 'Beyond smash',
  },
]

export default function BunsARPage() {
  const [activeId, setActiveId] = useState<MenuId>('bacon')

  const activeMenu = useMemo(
    () => MENUS.find((m) => m.id === activeId)!,
    [activeId],
  )

  const handleGoToMenu = () => {
    window.location.href = 'https://www.buns-ericeira.pt/menu'
  }

  return (
    <>
      <Script
        type="module"
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        strategy="afterInteractive"
      />

      <style jsx global>{`
        @keyframes bunsArPulse {
          0%, 100% {
            transform: translate3d(0, 0, 0) scale(1);
            box-shadow: 0 0 18px rgba(250, 204, 21, 0.45);
          }
          45% {
            transform: translate3d(0, -2px, 0) scale(1.07);
            box-shadow: 0 0 28px rgba(250, 204, 21, 0.9);
          }
        }
        .buns-ar-button {
          animation: bunsArPulse 1.7s ease-in-out infinite;
        }
      `}</style>

      <main className="w-full max-w-full overflow-x-hidden bg-black min-h-screen">

        {/* ── Hero strip ─────────────────────────────────────── */}
        <div className="bg-black border-b-4 border-buns-yellow px-4 sm:px-6 pt-8 pb-7">
          <div className="max-w-screen-lg mx-auto">
            <div className="inline-flex items-center gap-2 bg-buns-yellow text-black text-[11px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg mb-5">
              <span className="h-2 w-2 rounded-full bg-black animate-pulse" />
              AR Mode · Ativo
            </div>
            <h1
              className="font-display text-white uppercase leading-none tracking-tight"
              style={{ fontSize: 'clamp(3rem, 12vw, 7rem)' }}
            >
              BUNS<br />
              <span className="text-buns-yellow">Menu AR</span>
            </h1>
            <p className="mt-3 text-white/45 text-sm sm:text-base font-medium max-w-md">
              Coloca os teus burgers favoritos na mesa em tamanho real. Aponta o telemóvel e entra na experiência.
            </p>
          </div>
        </div>

        {/* ── Body ───────────────────────────────────────────── */}
        <div className="max-w-screen-lg mx-auto px-4 sm:px-6 pt-6 pb-32 space-y-5">

          {/* ── Burger selector ── */}
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.25em] text-white/35 mb-3">
              Escolhe o teu loadout
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MENUS.map((menu) => {
                const isActive = menu.id === activeId
                return (
                  <button
                    key={menu.id}
                    onClick={() => setActiveId(menu.id)}
                    className={`relative rounded-2xl border-2 px-3 py-3 text-left transition-all active:scale-[0.97]
                      ${isActive
                        ? 'border-buns-yellow bg-buns-yellow/10 shadow-[0_0_20px_rgba(250,204,21,0.3)]'
                        : 'border-white/15 bg-white/5 hover:bg-white/8'
                      }`}
                  >
                    <div className="flex items-start justify-between gap-1 mb-1">
                      <p className={`font-black text-sm uppercase tracking-wide ${isActive ? 'text-buns-yellow' : 'text-white'}`}>
                        {menu.label}
                      </p>
                      {isActive && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-buns-yellow text-black font-black uppercase shrink-0">
                          AR
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-white/45 leading-snug">{menu.subtitle}</p>
                    {menu.highlight && (
                      <p className="mt-1 text-[10px] text-buns-yellow/70 uppercase tracking-wide font-black">
                        {menu.highlight}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* ── Viewer + details ── */}
          <div className="grid lg:grid-cols-[3fr_2fr] gap-4 items-start">

            {/* AR viewer */}
            <div className="bg-white/5 border-2 border-white/10 rounded-3xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between gap-3">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/35">Visualizador AR</p>
                <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase px-2 py-1 rounded-md bg-buns-yellow/15 border border-buns-yellow/30 text-buns-yellow">
                  <span className="h-1.5 w-1.5 rounded-full bg-buns-yellow animate-pulse" />
                  Live
                </span>
              </div>
              <div className="p-3">
                <p className="text-xs text-white/40 text-center mb-2">
                  Aponte para a mesa e toque em{' '}
                  <span className="text-buns-yellow font-black">"Ver em AR"</span>
                </p>
                <model-viewer
                  src={activeMenu.modelSrc}
                  ar
                  ar-modes="webxr scene-viewer quick-look"
                  camera-controls
                  auto-rotate
                  auto-rotate-delay="0"
                  shadow-intensity="0"
                  exposure="2.2"
                  environment-image="neutral"
                  tone-mapping="aces"
                  quick-look-browsers="safari chrome"
                  style={{
                    width: '100%',
                    height: '52vh',
                    borderRadius: '16px',
                    background: 'transparent',
                    overflow: 'hidden',
                  }}
                >
                  <button
                    slot="ar-button"
                    className="buns-ar-button flex items-center gap-2 rounded-full bg-buns-yellow text-black text-sm font-black px-5 py-2.5 shadow-[0_0_20px_rgba(250,204,21,0.7)] active:scale-95 transition-transform mr-4 mb-4"
                  >
                    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-buns-yellow text-xs">⬢</span>
                    <span>VER EM AR</span>
                  </button>
                </model-viewer>
              </div>
            </div>

            {/* Details panel */}
            <div className="bg-white/5 border-2 border-white/10 rounded-3xl overflow-hidden">
              <div className="px-5 py-4 border-b border-white/10">
                <p className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-1">Smash Build</p>
                <p className="font-display text-white uppercase leading-none text-2xl">{activeMenu.name}</p>
                {activeMenu.highlight && (
                  <p className="text-xs text-buns-yellow font-black uppercase tracking-wide mt-1">{activeMenu.highlight}</p>
                )}
              </div>

              <div className="p-5 space-y-5">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-widest text-white/35 mb-2">Ingredientes</p>
                  <ul className="space-y-2">
                    {activeMenu.ingredients.map((item) => (
                      <li key={item} className="flex items-center gap-2 text-sm text-white/80">
                        <span className="w-2 h-2 rounded-full bg-buns-yellow shrink-0" />
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {['Smash Burgers', 'Ericeira', 'AR Preview'].map((tag) => (
                    <span key={tag} className="text-[10px] font-black uppercase tracking-wide px-2.5 py-1 rounded-lg border border-white/15 bg-white/5 text-white/45">
                      {tag}
                    </span>
                  ))}
                </div>

                <div className="space-y-2 pt-1">
                  <button
                    onClick={handleGoToMenu}
                    className="w-full py-4 bg-buns-yellow text-black font-black text-sm uppercase tracking-wide rounded-2xl active:scale-[0.98] transition shadow-[0_0_20px_rgba(250,204,21,0.35)]"
                  >
                    Abrir experiência AR →
                  </button>
                  <Link
                    href="/menu"
                    className="block w-full py-3 bg-white/8 border border-white/15 text-white/60 font-black text-sm uppercase tracking-wide rounded-2xl text-center active:scale-[0.98] transition"
                  >
                    Ver menu completo
                  </Link>
                  <p className="text-[10px] text-white/25 text-center">
                    BUNS · Ericeira · Smash Burgers AR Mode
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}
