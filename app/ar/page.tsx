'use client'

import { useState, useMemo } from 'react'
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
    modelSrc: '/ar-models/buns-classic-tray.glb', // futuro .glb
    productSlug: 'classic-menu',
    highlight: 'Double smash', // double meat
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
    modelSrc: '/ar-models/buns-epic-tray.glb', // futuro .glb
    productSlug: 'epic-menu',
    highlight: 'Smash spicy',
  },
  {
    id: 'veggie',
    name: 'Veggie Bun',
    label: 'VEGGIE',
    subtitle: '100% plant based',
    ingredients: [
      'Molho especial',
      'Carne Beyond Meat',
      'Cebola',
      'Alface',
    ],
    modelSrc: '/ar-models/buns-veggie-tray.glb', // futuro .glb
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
      {/* Carrega o web component <model-viewer> */}
      <Script
        type="module"
        src="https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js"
        strategy="afterInteractive"
      />

      {/* Animação global para o botão de AR */}
      <style jsx global>{`
        @keyframes bunsArPulse {
          0%,
          100% {
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

      <main className="min-h-screen relative overflow-hidden bg-black text-white flex flex-col">
        {/* BACKGROUND BUNS STYLE */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-40 -right-24 w-80 h-80 rounded-full bg-yellow-500/10 blur-3xl" />
          <div className="absolute -bottom-40 -left-24 w-80 h-80 rounded-full bg-yellow-400/5 blur-3xl" />
          <div className="absolute inset-x-0 top-40 h-px bg-gradient-to-r from-transparent via-yellow-500/40 to-transparent" />
        </div>

        {/* HEADER */}
        <header className="py-4 border-b border-zinc-800 relative z-10">
          <div className="max-w-5xl mx-auto px-4 flex items-center justify-between gap-4">
            <div className="space-y-1">
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-[0.3em]">
                BUNS
              </h1>
              <p className="text-yellow-400 text-[10px] sm:text-xs uppercase">
                AR EXPERIENCE · SMASH BURGERS
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 text-right">
              <span className="inline-flex items-center gap-2 rounded-full border border-yellow-400/60 bg-black/60 px-3 py-1">
                <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[9px] font-semibold tracking-[0.2em] uppercase text-yellow-200">
                  AR MODE ON
                </span>
              </span>
              <div>
                <p className="text-[10px] text-zinc-400 uppercase">
                  Smash Level
                </p>
                <p className="text-sm font-semibold text-yellow-300">
                  {activeMenu.label}
                </p>
              </div>
            </div>
          </div>
        </header>

        {/* CONTEÚDO */}
        <section className="flex-1 max-w-5xl mx-auto w-full px-4 pb-8 pt-4 flex flex-col gap-5 relative z-10">
          {/* SELECTOR DE MENUS */}
          <div className="flex flex-col gap-2">
            <p className="text-[11px] text-zinc-400 uppercase tracking-[0.25em]">
              Escolhe o teu loadout
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {MENUS.map((menu) => {
                const isActive = menu.id === activeId
                return (
                  <button
                    key={menu.id}
                    onClick={() => setActiveId(menu.id)}
                    className={[
                      'relative rounded-xl border text-xs sm:text-[11px] px-3 py-2 text-left transition-all',
                      'bg-zinc-900/80 hover:bg-zinc-800/90',
                      isActive
                        ? 'border-yellow-400 shadow-[0_0_25px_rgba(250,204,21,0.5)]'
                        : 'border-zinc-700',
                    ].join(' ')}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <p className="font-semibold uppercase">
                          {menu.label}
                        </p>
                        <p className="text-[10px] text-zinc-400">
                          {menu.subtitle}
                        </p>
                      </div>
                      {isActive && (
                        <span className="text-[9px] px-2 py-0.5 rounded-full bg-yellow-400 text-black font-semibold">
                          AR READY
                        </span>
                      )}
                    </div>
                    {menu.highlight && (
                      <p className="mt-1 text-[9px] text-yellow-300 uppercase tracking-[0.18em]">
                        {menu.highlight}
                      </p>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* VIEWER + INFO */}
          <div className="grid lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)] gap-4 items-start">
            {/* ZONA AR */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-3 sm:p-4 relative overflow-hidden">
              <div className="pointer-events-none absolute inset-0 opacity-40">
                {/* grade leve estilo gaming */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(250,204,21,0.04)_0,_transparent_60%)]" />
                <div className="absolute inset-4 border border-zinc-800/60 rounded-2xl" />
              </div>

              <p className="text-[11px] text-gray-300 mb-2 text-center relative z-10">
                Aponte para a mesa e toque em{' '}
                <span className="font-semibold text-yellow-300">
                  “Ver em AR”
                </span>
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
                  height: '55vh',
                  borderRadius: '18px',
                  background: 'transparent',
                  overflow: 'hidden',
                }}
              >
                {/* BOTÃO AR PERSONALIZADO E ANIMADO */}
                <button
                  slot="ar-button"
                  className="buns-ar-button flex items-center gap-2 rounded-full bg-yellow-400 text-black text-[11px] font-semibold px-4 py-2 shadow-[0_0_20px_rgba(250,204,21,0.7)] active:scale-95 transition-transform mr-4 mb-4"
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-black text-yellow-300 text-xs">
                    ⬢
                  </span>
                  <span>VER EM AR</span>
                </button>
              </model-viewer>
            </div>

            {/* PAINEL DE DETALHES */}
            <div className="rounded-2xl border border-zinc-800 bg-zinc-950/80 backdrop-blur-sm p-4 space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] text-zinc-400 uppercase tracking-[0.25em]">
                  Smash Build
                </p>
                <h2 className="text-xl font-bold">{activeMenu.name}</h2>
                {activeMenu.highlight && (
                  <p className="text-[11px] text-yellow-300">
                    {activeMenu.highlight}
                  </p>
                )}
              </div>

              <div>
                <p className="text-[11px] text-zinc-400 uppercase mb-1 tracking-[0.2em]">
                  Ingredientes
                </p>
                <ul className="text-sm text-zinc-100 space-y-1">
                  {activeMenu.ingredients.map((item) => (
                    <li key={item} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* mini tags extra para vibe “card de jogo” */}
              <div className="flex flex-wrap gap-2 text-[10px] uppercase tracking-[0.16em] text-zinc-300">
                <span className="px-2 py-1 rounded-full border border-zinc-700 bg-zinc-900/70">
                  Smash Burgers
                </span>
                <span className="px-2 py-1 rounded-full border border-zinc-700 bg-zinc-900/70">
                  Ericeira Style
                </span>
                <span className="px-2 py-1 rounded-full border border-zinc-700 bg-zinc-900/70">
                  AR Preview
                </span>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleGoToMenu}
                  className="w-full py-3 rounded-full bg-yellow-400 text-black font-bold text-sm tracking-wide active:scale-95 transition-transform shadow-[0_0_25px_rgba(250,204,21,0.45)]"
                >
                  IR PARA MENU
                </button>

              <p className="text-[10px] text-zinc-500 text-center">
                  Powered by BUNS — Ericeira · Smash Burgers AR Mode
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </>
  )
}
