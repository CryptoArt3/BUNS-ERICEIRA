'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SOUND_KEY = 'buns_admin_sound'
const REPEAT_MS = 8000

function tryBeep(): boolean {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.05)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.5)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
    return true
  } catch {
    return false
  }
}

export function useOrderSounds(hasAlerts: boolean) {
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [soundBlocked, setSoundBlocked] = useState(false)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Load persisted preference
  useEffect(() => {
    const saved = localStorage.getItem(SOUND_KEY)
    if (saved === '1') setSoundEnabled(true)
  }, [])

  const playAlert = useCallback(async () => {
    // Try HTML Audio first
    try {
      const a = new Audio('/sounds/new-order.wav')
      await a.play()
      setSoundBlocked(false)
      return
    } catch {}
    // Fallback to WebAudio beep
    if (tryBeep()) {
      setSoundBlocked(false)
      return
    }
    // Both blocked — disable sound and show banner
    setSoundBlocked(true)
    setSoundEnabled(false)
    localStorage.setItem(SOUND_KEY, '0')
  }, [])

  // Keep ref up to date without triggering the interval effect
  const playAlertRef = useRef(playAlert)
  useEffect(() => { playAlertRef.current = playAlert }, [playAlert])

  // Start/stop the repeating alert based on alert state
  useEffect(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    if (soundEnabled && hasAlerts) {
      playAlertRef.current()
      intervalRef.current = setInterval(() => playAlertRef.current(), REPEAT_MS)
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [soundEnabled, hasAlerts])

  const toggleSound = useCallback(async () => {
    if (soundEnabled) {
      setSoundEnabled(false)
      localStorage.setItem(SOUND_KEY, '0')
      return
    }
    // Arm the audio context with this user gesture (silent, just to unlock)
    let armed = false
    try {
      const a = new Audio('/sounds/new-order.wav')
      a.volume = 0
      await a.play()
      a.pause()
      armed = true
      setSoundBlocked(false)
    } catch {
      armed = tryBeep()
      if (armed) setSoundBlocked(false)
      else setSoundBlocked(true)
    }
    if (!armed) return
    setSoundEnabled(true)
    localStorage.setItem(SOUND_KEY, '1')
    // The useEffect above will fire and play immediately if hasAlerts is true
  }, [soundEnabled])

  return { soundEnabled, soundBlocked, toggleSound }
}
