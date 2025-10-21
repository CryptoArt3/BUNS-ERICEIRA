'use client'
import { useEffect, useState } from 'react'

const THEMES = [
  { id: 'default',  label: '⚡ Default' },
  { id: 'surf',     label: '🌊 Surf' },
  { id: 'graffiti', label: '🎨 Graffiti' },
]

export const ThemeToggle = () => {
  const [theme, setTheme] = useState<string>('default')

  // carregar preferências no cliente
  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('buns_theme') || 'default'
    setTheme(saved)
  }, [])

  // aplicar classe & persistir
  useEffect(() => {
    if (typeof document === 'undefined') return
    const b = document.body
    b.classList.remove('theme-surf', 'theme-graffiti')
    if (theme === 'surf') b.classList.add('theme-surf')
    if (theme === 'graffiti') b.classList.add('theme-graffiti')
    try {
      localStorage.setItem('buns_theme', theme)
    } catch {}
  }, [theme])

  return (
    <select
      value={theme}
      onChange={(e) => setTheme(e.target.value)}
      className="btn btn-ghost text-sm"
    >
      {THEMES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
    </select>
  )
}
