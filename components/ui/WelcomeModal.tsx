'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { AnimatePresence, motion } from 'framer-motion'

const STORAGE_KEY = 'buns_welcome_seen_at'
const DAYS_INTERVAL = 1 // <- mostra novamente passado 1 dia (altera se quiseres)

function shouldOpen(): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return true
    const last = new Date(raw).getTime()
    const now = Date.now()
    const diffDays = (now - last) / (1000 * 60 * 60 * 24)
    return diffDays >= DAYS_INTERVAL
  } catch {
    return true
  }
}

export default function WelcomeModal() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setMounted(true)
    // só decide no cliente para evitar hydration issues
    if (shouldOpen()) setOpen(true)
  }, [])

  const close = useCallback(() => {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString())
    } catch {}
    setOpen(false)
  }, [])

  const goToMenu = useCallback(() => {
    close()
    router.push('/menu')
  }, [close, router])

  // ESC para fechar
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, close])

  if (!mounted) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="backdrop"
          className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={close}
          aria-hidden="true"
        >
          <motion.div
            key="dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Bem-vindo à BUNS Smash Burgers"
            initial={{ opacity: 0, scale: 0.98, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98, y: 10 }}
            transition={{ duration: 0.18 }}
            className="mx-auto mt-24 sm:mt-28 w-[92%] max-w-lg rounded-3xl border border-white/10 bg-white/5 shadow-buns overflow-hidden"
            onClick={(e) => e.stopPropagation()} // não fechar ao clicar dentro
          >
            {/* Vídeo da mascote */}
            <div className="relative">
              <video
                src="/mascote-poster.mp4"
                poster="/mascote-poster.mp4"
                autoPlay
                muted
                loop
                playsInline
                preload="auto"
                className="w-full h-64 object-cover bg-black/60"
              />
              {/* Botão Fechar */}
              <button
                onClick={close}
                className="absolute top-2 right-2 rounded-full bg-black/60 hover:bg-black/70 border border-white/10 px-3 py-1 text-sm"
                aria-label="Fechar"
              >
                ✕
              </button>
            </div>

            {/* Texto */}
            <div className="p-5 sm:p-6">
              <h3 className="font-display text-2xl">
                Bem-vindos à <span className="text-buns-yellow">BUNS Smash Burgers</span>!
              </h3>
              <p className="mt-2 text-white/80">
                A chapa já está quente 🔥 — explora o menu e cria o teu combo perfeito.
              </p>

              <div className="mt-4 flex flex-col sm:flex-row gap-2">
                {/* Agora fecha e navega */}
                <button
                  onClick={goToMenu}
                  className="btn btn-primary flex-1 text-center"
                >
                  Ver Menu
                </button>
                <button onClick={close} className="btn btn-ghost flex-1">
                  Fechar
                </button>
              </div>

              <p className="mt-3 text-xs text-white/50">
                Dica: mostramos este vídeo no máximo 1x por dia.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
