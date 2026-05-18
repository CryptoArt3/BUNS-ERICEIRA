'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SOUND_KEY = 'buns_admin_sound'
const SOUND_PATH = '/sounds/new-order.wav'
const WA_LOOP_MS = 3000 // WebAudio fallback repeat interval

/* ─── WebAudio two-tone beep ─────────────────────────────── */
function doBeep(ctx: AudioContext) {
  const t = ctx.currentTime
  const notes = [
    { freq: 880,  from: 0,    to: 0.30 },
    { freq: 1100, from: 0.45, to: 0.75 },
  ]
  for (const n of notes) {
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = n.freq
    gain.gain.setValueAtTime(0.001, t + n.from)
    gain.gain.exponentialRampToValueAtTime(0.35, t + n.from + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + n.to)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t + n.from)
    osc.stop(t + n.to)
  }
}

/* ─── Hook ───────────────────────────────────────────────── */
export function useOrderSounds(hasAlerts: boolean) {
  const [soundEnabled, setSoundEnabled] = useState(false)
  const [soundBlocked, setSoundBlocked] = useState(false)

  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const webCtxRef  = useRef<AudioContext | null>(null)
  const waLoopRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const alertOnRef = useRef(false) // tracks whether alert is currently running

  /* ── Load persisted preference ── */
  useEffect(() => {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(SOUND_KEY) === '1') {
      setSoundEnabled(true)
    }
  }, [])

  /* ── Stop all alert sounds ── */
  const stopAlert = useCallback(() => {
    alertOnRef.current = false
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (waLoopRef.current) {
      clearInterval(waLoopRef.current)
      waLoopRef.current = null
    }
  }, [])

  /* ── WebAudio looping fallback ── */
  const startWebAudioLoop = useCallback(() => {
    try {
      if (!webCtxRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext
        webCtxRef.current = new Ctx()
      }
      const ctx = webCtxRef.current
      doBeep(ctx) // immediate first beep
      if (waLoopRef.current) clearInterval(waLoopRef.current)
      waLoopRef.current = setInterval(() => {
        if (alertOnRef.current) doBeep(ctx)
      }, WA_LOOP_MS)
      setSoundBlocked(false)
    } catch {
      setSoundBlocked(true)
      setSoundEnabled(false)
      localStorage.setItem(SOUND_KEY, '0')
    }
  }, [])

  /* ── Start looping alert ── */
  const startAlert = useCallback(async () => {
    alertOnRef.current = true

    // Reuse or create Audio element with loop=true
    if (!audioRef.current) {
      audioRef.current = new Audio(SOUND_PATH)
      audioRef.current.loop = true
    }

    try {
      await audioRef.current.play()
      setSoundBlocked(false)
    } catch {
      // HTML Audio blocked or unavailable → WebAudio fallback
      startWebAudioLoop()
    }
  }, [startWebAudioLoop])

  /* ── React to hasAlerts / soundEnabled ── */
  useEffect(() => {
    if (soundEnabled && hasAlerts) {
      startAlert()
    } else {
      stopAlert()
    }
    return () => stopAlert()
  // startAlert and stopAlert are stable (useCallback with no deps that change)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundEnabled, hasAlerts])

  /* ── Toggle (must be triggered by user gesture to unlock audio) ── */
  const toggleSound = useCallback(async () => {
    if (soundEnabled) {
      setSoundEnabled(false)
      localStorage.setItem(SOUND_KEY, '0')
      stopAlert()
      return
    }

    // Unlock AudioContext / HTML Audio with this user gesture
    let unlocked = false
    try {
      const a = new Audio(SOUND_PATH)
      a.volume = 0
      await a.play()
      a.pause()
      unlocked = true
      setSoundBlocked(false)
    } catch {
      // Try WebAudio unlock
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new Ctx()
        webCtxRef.current = ctx
        const osc = ctx.createOscillator()
        const g = ctx.createGain()
        g.gain.value = 0
        osc.connect(g).connect(ctx.destination)
        osc.start()
        osc.stop(ctx.currentTime + 0.001)
        unlocked = true
        setSoundBlocked(false)
      } catch {
        setSoundBlocked(true)
      }
    }
    if (!unlocked) return

    setSoundEnabled(true)
    localStorage.setItem(SOUND_KEY, '1')
    // useEffect above fires next tick and calls startAlert() if hasAlerts is true
  }, [soundEnabled, stopAlert])

  return {
    soundEnabled,
    soundBlocked,
    toggleSound,
    /** true when sound is enabled AND there are unacknowledged alerts */
    alarmActive: soundEnabled && hasAlerts,
  }
}
