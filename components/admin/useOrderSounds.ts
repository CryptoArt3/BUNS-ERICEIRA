'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const SOUND_KEY   = 'buns_admin_sound'
const SOUND_PATH  = '/sounds/new-order.wav'
const WA_LOOP_MS  = 3000

/* ─── WebAudio two-tone beep ──────────────────────────────── */
function doBeep(ctx: AudioContext) {
  const t = ctx.currentTime
  const notes = [
    { freq: 880,  from: 0,    to: 0.30 },
    { freq: 1100, from: 0.45, to: 0.75 },
  ]
  for (const n of notes) {
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.value = n.freq
    gain.gain.setValueAtTime(0.001, t + n.from)
    gain.gain.exponentialRampToValueAtTime(0.35,  t + n.from + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, t + n.to)
    osc.connect(gain).connect(ctx.destination)
    osc.start(t + n.from)
    osc.stop(t + n.to)
  }
}

/* ─── Hook ────────────────────────────────────────────────── */
export function useOrderSounds(hasAlerts: boolean) {
  // soundEnabled  : user wants audio on (persisted)
  // audioUnlocked : browser accepted at least one play() via user gesture (session only)
  // soundBlocked  : browser rejected unlock attempt → show "click to activate" prompt
  const [soundEnabled,  setSoundEnabled]  = useState(false)
  const [audioUnlocked, setAudioUnlocked] = useState(false)
  const [soundBlocked,  setSoundBlocked]  = useState(false)

  const audioRef   = useRef<HTMLAudioElement | null>(null)
  const webCtxRef  = useRef<AudioContext | null>(null)
  const waLoopRef  = useRef<ReturnType<typeof setInterval> | null>(null)
  const alertOnRef = useRef(false)

  /* ── Restore persisted preference (unlock state is never persisted) ── */
  useEffect(() => {
    if (localStorage.getItem(SOUND_KEY) === '1') setSoundEnabled(true)
  }, [])

  /* ── Stop ── */
  const stopAlert = useCallback(() => {
    if (!alertOnRef.current) return
    alertOnRef.current = false
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.currentTime = 0
    }
    if (waLoopRef.current) {
      clearInterval(waLoopRef.current)
      waLoopRef.current = null
    }
    console.log('[ORDER SOUND] stop alarm')
  }, [])

  /* ── WebAudio loop (fallback when HTML Audio is blocked) ── */
  const startWebAudioLoop = useCallback(() => {
    try {
      if (!webCtxRef.current) {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext
        webCtxRef.current = new Ctx()
      }
      const ctx = webCtxRef.current
      if (ctx.state === 'suspended') ctx.resume()
      doBeep(ctx)
      if (waLoopRef.current) clearInterval(waLoopRef.current)
      waLoopRef.current = setInterval(() => {
        if (!alertOnRef.current || !webCtxRef.current) return
        if (webCtxRef.current.state === 'suspended') webCtxRef.current.resume()
        doBeep(webCtxRef.current)
      }, WA_LOOP_MS)
      setSoundBlocked(false)
    } catch {
      setSoundBlocked(true)
    }
  }, [])

  /* ── Start looping alarm ── */
  const startAlert = useCallback(async () => {
    if (alertOnRef.current) return  // already playing — idempotent
    alertOnRef.current = true
    console.log('[ORDER SOUND] auto-start alarm')

    if (!audioRef.current) {
      audioRef.current = new Audio(SOUND_PATH)
      audioRef.current.loop = true
    }
    try {
      await audioRef.current.play()
      setSoundBlocked(false)
    } catch {
      // HTML Audio blocked → WebAudio loop (ctx already resumed via toggleSound)
      startWebAudioLoop()
    }
  }, [startWebAudioLoop])

  /* ── Main effect: all three conditions must be true to ring ── */
  useEffect(() => {
    if (soundEnabled && audioUnlocked && hasAlerts) {
      console.log('[ORDER SOUND] auto-start alarm (effect trigger)')
      startAlert()
    } else {
      stopAlert()
      // Prompt user to click if they want sound but haven't unlocked yet
      if (soundEnabled && !audioUnlocked && hasAlerts) {
        setSoundBlocked(true)
      }
    }
    return () => stopAlert()
  }, [soundEnabled, audioUnlocked, hasAlerts, startAlert, stopAlert])

  /* ── Toggle (must be called from a user gesture to unlock audio) ── */
  const toggleSound = useCallback(async () => {
    if (soundEnabled) {
      setSoundEnabled(false)
      setAudioUnlocked(false)
      localStorage.setItem(SOUND_KEY, '0')
      stopAlert()
      return
    }

    // Try HTML Audio unlock (silent play)
    let unlocked = false
    try {
      const a = new Audio(SOUND_PATH)
      a.volume = 0
      await a.play()
      a.pause()
      unlocked = true
      setSoundBlocked(false)
    } catch {
      // HTML Audio blocked → try WebAudio resume
      try {
        const Ctx = window.AudioContext || (window as any).webkitAudioContext
        const ctx = new Ctx()
        webCtxRef.current = ctx
        await ctx.resume()
        unlocked = true
        setSoundBlocked(false)
      } catch {
        setSoundBlocked(true)
      }
    }
    if (!unlocked) return

    // Both flags set in one batch → single re-render → effect fires with
    // soundEnabled=true + audioUnlocked=true → startAlert() if hasAlerts
    setSoundEnabled(true)
    setAudioUnlocked(true)
    localStorage.setItem(SOUND_KEY, '1')
  }, [soundEnabled, stopAlert])

  return {
    soundEnabled,
    soundBlocked,
    toggleSound,
    /** true when sound is enabled AND there are unacknowledged orders */
    alarmActive: soundEnabled && hasAlerts,
  }
}
