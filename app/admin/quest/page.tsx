'use client'

import { useRef, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

type State = 'idle' | 'loading' | 'success' | 'error'

export default function AdminQuestPage() {
  const [digits, setDigits]   = useState(['', '', '', ''])
  const [state, setState]     = useState<State>('idle')
  const [message, setMessage] = useState('')

  const ref0 = useRef<HTMLInputElement>(null)
  const ref1 = useRef<HTMLInputElement>(null)
  const ref2 = useRef<HTMLInputElement>(null)
  const ref3 = useRef<HTMLInputElement>(null)
  const inputRefs = [ref0, ref1, ref2, ref3]

  const code = digits.join('')

  function handleChange(idx: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...digits]
    next[idx] = digit
    setDigits(next)
    if (digit && idx < 3) inputRefs[idx + 1].current?.focus()
  }

  function handleKeyDown(idx: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !digits[idx] && idx > 0) {
      inputRefs[idx - 1].current?.focus()
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 4)
    if (pasted.length === 4) {
      setDigits(pasted.split(''))
      inputRefs[3].current?.focus()
    }
    e.preventDefault()
  }

  async function handleSubmit() {
    if (code.length < 4 || state === 'loading') return
    setState('loading')
    setMessage('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      const token = session?.access_token
      if (!token) {
        setState('error')
        setMessage('Sem sessão activa. Faz login novamente.')
        return
      }

      const res = await fetch('/api/quest/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ code }),
      })

      const data = await res.json()

      if (!res.ok) {
        setState('error')
        setMessage(data.error ?? 'Erro desconhecido')
      } else {
        setState('success')
        setMessage(data.reward_label)
        setDigits(['', '', '', ''])
      }
    } catch {
      setState('error')
      setMessage('Erro de rede. Tenta novamente.')
    }
  }

  function reset() {
    setState('idle')
    setMessage('')
    setDigits(['', '', '', ''])
    setTimeout(() => inputRefs[0].current?.focus(), 50)
  }

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-black flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">

        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-buns-yellow font-black text-xs uppercase tracking-[0.25em]">
            BUNS Quest
          </p>
          <h1 className="font-display text-white text-4xl uppercase leading-none">
            Confirmar<br />Recompensas
          </h1>
        </div>

        {/* 4-digit input */}
        <div className="space-y-3">
          <p className="text-white/40 text-sm text-center">
            Código de 4 dígitos do cliente
          </p>
          <div className="flex gap-3 justify-center">
            {digits.map((d, idx) => (
              <input
                key={idx}
                ref={inputRefs[idx]}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={d}
                onChange={(e) => handleChange(idx, e.target.value)}
                onKeyDown={(e) => handleKeyDown(idx, e)}
                onPaste={handlePaste}
                className="w-16 h-20 text-center text-3xl font-black bg-white border-2 border-black/20 rounded-xl text-black focus:border-buns-yellow focus:outline-none transition-colors"
              />
            ))}
          </div>
        </div>

        {/* Result */}
        {state === 'success' && (
          <div className="bg-green-500/10 border border-green-500/25 rounded-2xl p-5 text-center space-y-1">
            <p className="text-green-400 text-3xl">✓</p>
            <p className="font-black text-white text-lg">{message}</p>
            <p className="text-green-400 text-sm font-black uppercase tracking-wide">
              Entregue com sucesso
            </p>
          </div>
        )}

        {state === 'error' && (
          <div className="bg-red-500/10 border border-red-500/25 rounded-2xl p-5 text-center space-y-1">
            <p className="text-red-400 text-3xl">✗</p>
            <p className="text-red-300 text-sm font-black">{message}</p>
          </div>
        )}

        {/* Actions */}
        {state !== 'success' ? (
          <button
            onClick={handleSubmit}
            disabled={code.length < 4 || state === 'loading'}
            className="w-full py-4 bg-black border-2 border-buns-yellow text-buns-yellow font-black text-sm uppercase tracking-wide rounded-xl disabled:opacity-25 transition-opacity active:scale-[0.98]"
          >
            {state === 'loading' ? 'A confirmar...' : 'Confirmar'}
          </button>
        ) : (
          <button
            onClick={reset}
            className="w-full py-4 bg-white/8 border border-white/15 text-white font-black text-sm uppercase tracking-wide rounded-xl active:scale-[0.98] transition"
          >
            Novo código
          </button>
        )}

      </div>
    </main>
  )
}
