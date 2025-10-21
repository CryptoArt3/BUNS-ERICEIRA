'use client'

import { useEffect, useState } from 'react'

export default function SoundToggle({
  onChange,
  className = '',
}: {
  onChange?: (enabled: boolean) => void
  className?: string
}) {
  const [enabled, setEnabled] = useState<boolean>(false)

  useEffect(() => {
    const saved = localStorage.getItem('buns_admin_sound')
    if (saved) setEnabled(saved === '1')
  }, [])

  useEffect(() => {
    localStorage.setItem('buns_admin_sound', enabled ? '1' : '0')
    onChange?.(enabled)
  }, [enabled, onChange])

  // Primeiro clique desbloqueia o Audio no browser
  const armAudio = async () => {
    try {
      const a = new Audio()
      a.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAAAAABAAAA' // “silêncio”
      await a.play().catch(() => {})
    } catch {}
  }

  const toggle = async () => {
    if (!enabled) await armAudio()
    setEnabled((v) => !v)
  }

  return (
    <button
      onClick={toggle}
      className={`btn ${enabled ? 'btn-primary' : 'btn-ghost'} ${className}`}
      aria-pressed={enabled}
    >
      {enabled ? '🔊 Som ativo' : '🔈 Ativar som'}
    </button>
  )
}
