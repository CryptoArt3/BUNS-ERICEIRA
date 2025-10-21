'use client'

import { useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase/client'

type Options = {
  enabled: boolean
}

function makeBeep(frequency = 880, duration = 0.15) {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.2, ctx.currentTime + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + duration)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + duration)
  } catch {}
}

function play(src: string, fallbackFreq?: number) {
  const a = new Audio()
  a.src = src
  a.play().catch(() => {
    if (fallbackFreq) makeBeep(fallbackFreq)
  })
}

export function useOrderSounds({ enabled }: Options) {
  // Momento em que a página montou — evita tocar ao carregar pedidos antigos
  const startTs = useRef<number>(Date.now())

  // Pré-resolve paths de som
  const sounds = useMemo(
    () => ({
      newOrder: '/sounds/new-order.mp3',
      preparing: '/sounds/preparing.mp3',
      delivered: '/sounds/delivered.mp3',
    }),
    []
  )

  useEffect(() => {
    if (!enabled) return

    const channel = supabase
      .channel('orders-sound')
      // Novo pedido
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'orders' },
        (payload) => {
          const created = new Date((payload.new as any)?.created_at ?? Date.now()).getTime()
          if (created >= startTs.current - 1500) {
            play(sounds.newOrder, 880) // fallback beep
          }
        }
      )
      // Mudanças de estado
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => {
          const oldStatus = (payload.old as any)?.status
          const newStatus = (payload.new as any)?.status
          if (oldStatus === newStatus) return
          if (newStatus === 'preparing') play(sounds.preparing, 660)
          if (newStatus === 'delivered') play(sounds.delivered, 520)
        }
      )
      .subscribe((status) => {
        if (status !== 'SUBSCRIBED') return
      })

    return () => {
      supabase.removeChannel(channel)
    }
  }, [enabled, sounds])
}
