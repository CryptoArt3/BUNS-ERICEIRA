'use client'
import { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

export const ModeToggle = () => {
  const [mode, setMode] = useState<'day' | 'night'>('night')

  // aplica a classe na 1ª render
  useEffect(() => {
    const saved = (typeof window !== 'undefined'
      ? (localStorage.getItem('buns_mode') as 'day' | 'night' | null)
      : null) || 'night'
    setMode(saved)
    document.body.classList.remove('mode-day', 'mode-night')
    document.body.classList.add(`mode-${saved}`)
  }, [])

  // sempre que muda o modo
  useEffect(() => {
    document.body.classList.remove('mode-day', 'mode-night')
    document.body.classList.add(`mode-${mode}`)
    localStorage.setItem('buns_mode', mode)
  }, [mode])

  return (
    <button onClick={() => setMode(mode === 'day' ? 'night' : 'day')}
            className="btn btn-ghost gap-2" aria-label="Alternar Dia/Noite">
      {mode === 'day' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
      {mode === 'day' ? 'Dia' : 'Noite'}
    </button>
  )
}
