'use client'

import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'
import BonusProgressBar from '@/components/BonusProgressBar'

type Tracker = {
  ath_target: number
  current_billing: number
  is_achieved: boolean
  month_label: string
  updated_at: string
}

type HistoryEntry = {
  id: string
  type: 'ath_update' | 'billing_update'
  value: number
  label: string
  created_at: string
}

type FormState = 'idle' | 'loading' | 'success' | 'error'

const euro = (n: number) =>
  new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' }).format(n)

const todayLabel = () =>
  new Date().toLocaleDateString('pt-PT', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })

async function getToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession()
  return data.session?.access_token ?? null
}

export default function AdminBonusPage() {
  const [tracker, setTracker] = useState<Tracker | null>(null)
  const [history, setHistory] = useState<HistoryEntry[]>([])

  const [athValue, setAthValue] = useState('')
  const [athLabel, setAthLabel] = useState('')
  const [athState, setAthState] = useState<FormState>('idle')
  const [athMsg, setAthMsg] = useState('')

  const [billingValue, setBillingValue] = useState('')
  const [billingState, setBillingState] = useState<FormState>('idle')
  const [billingMsg, setBillingMsg] = useState('')

  const load = useCallback(async () => {
    const res = await fetch('/api/bonus?history=1')
    const data = await res.json()
    if (!data.error) {
      setTracker(data.tracker)
      setHistory(data.history ?? [])
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleAthSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = parseFloat(athValue)
    if (isNaN(value) || value <= 0 || athState === 'loading') return

    setAthState('loading')
    setAthMsg('')
    const token = await getToken()
    if (!token) {
      setAthState('error')
      setAthMsg('Sem sessão activa.')
      return
    }

    const res = await fetch('/api/bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'ath_update', value, label: athLabel }),
    })

    if (res.ok) {
      setAthState('success')
      setAthMsg('ATH actualizado. Faturação e progresso reiniciados.')
      setAthValue('')
      await load()
    } else {
      const d = await res.json()
      setAthState('error')
      setAthMsg(d.error ?? 'Erro desconhecido.')
    }
    setTimeout(() => { setAthState('idle'); setAthMsg('') }, 4000)
  }

  async function handleBillingSubmit(e: React.FormEvent) {
    e.preventDefault()
    const value = parseFloat(billingValue)
    if (isNaN(value) || value < 0 || billingState === 'loading') return

    setBillingState('loading')
    setBillingMsg('')
    const token = await getToken()
    if (!token) {
      setBillingState('error')
      setBillingMsg('Sem sessão activa.')
      return
    }

    const res = await fetch('/api/bonus', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ action: 'billing_update', value, label: todayLabel() }),
    })

    if (res.ok) {
      const d = await res.json()
      setBillingState('success')
      setBillingMsg(d.is_achieved ? '🎉 Bonus conquistado! Meta superada.' : 'Faturação actualizada.')
      setBillingValue('')
      await load()
    } else {
      const d = await res.json()
      setBillingState('error')
      setBillingMsg(d.error ?? 'Erro desconhecido.')
    }
    setTimeout(() => { setBillingState('idle'); setBillingMsg('') }, 4000)
  }

  const previewPct =
    tracker && billingValue && tracker.ath_target > 0
      ? Math.round((parseFloat(billingValue) / tracker.ath_target) * 100)
      : null

  return (
    <main className="min-h-[calc(100vh-3.5rem)] bg-black text-white">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">

        {/* Page header */}
        <div>
          <p className="text-buns-yellow font-black text-xs uppercase tracking-[0.25em]">Admin</p>
          <h1 className="font-display text-white text-4xl uppercase leading-none">
            Bonus Tracker
          </h1>
        </div>

        {/* Current state preview */}
        {tracker && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-6">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
              Vista actual (pública)
            </p>

            <BonusProgressBar
              athTarget={tracker.ath_target}
              currentBilling={tracker.current_billing}
              isAchieved={tracker.is_achieved}
              monthLabel={tracker.month_label}
            />

            <div className="pt-4 border-t border-white/8 grid grid-cols-2 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">ATH Alvo</p>
                <p className="font-black text-xl text-white">{euro(tracker.ath_target)}</p>
                {tracker.month_label && (
                  <p className="text-xs text-white/30 mt-0.5">{tracker.month_label}</p>
                )}
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-white/30 mb-1">Faturação Acumulada</p>
                <p className={`font-black text-xl ${tracker.is_achieved ? 'text-buns-yellow' : 'text-white'}`}>
                  {euro(tracker.current_billing)}
                </p>
                {tracker.updated_at && (
                  <p className="text-xs text-white/30 mt-0.5">
                    {new Date(tracker.updated_at).toLocaleString('pt-PT', {
                      day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                    })}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Form 1 — Set ATH */}
        <form
          onSubmit={handleAthSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
        >
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
              Definir ATH do mês anterior
            </p>
            <p className="text-xs text-white/25 mt-0.5">
              Define a nova meta e reinicia o contador do mês.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Valor (€)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={athValue}
                onChange={(e) => setAthValue(e.target.value)}
                placeholder="ex: 4250.00"
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white font-black text-sm placeholder:text-white/20 focus:border-buns-yellow focus:outline-none transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-white/50 mb-1.5 block">Mês de referência</label>
              <input
                type="text"
                value={athLabel}
                onChange={(e) => setAthLabel(e.target.value)}
                placeholder="ex: Maio 2026"
                className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white text-sm placeholder:text-white/20 focus:border-buns-yellow focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={!athValue || parseFloat(athValue) <= 0 || athState === 'loading'}
            className="w-full py-3 bg-white/8 border border-white/15 text-white font-black text-sm uppercase tracking-wide rounded-xl disabled:opacity-30 hover:border-buns-yellow/50 transition active:scale-[0.98]"
          >
            {athState === 'loading' ? 'A guardar...' : 'Definir novo ATH'}
          </button>

          {athMsg && (
            <p className={`text-sm font-black ${athState === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {athMsg}
            </p>
          )}
        </form>

        {/* Form 2 — Update billing */}
        <form
          onSubmit={handleBillingSubmit}
          className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4"
        >
          <div>
            <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
              Actualizar faturação acumulada
            </p>
            <p className="text-xs text-white/25 mt-0.5">
              Data automática: {todayLabel()}
            </p>
          </div>

          <div>
            <label className="text-xs text-white/50 mb-1.5 block">
              Total acumulado até hoje (€)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={billingValue}
              onChange={(e) => setBillingValue(e.target.value)}
              placeholder="ex: 2100.00"
              className="w-full bg-white/8 border border-white/15 rounded-xl px-4 py-3 text-white font-black text-2xl placeholder:text-white/20 focus:border-buns-yellow focus:outline-none transition-colors"
            />
          </div>

          {previewPct !== null && !isNaN(previewPct) && (
            <div className="flex items-center gap-2">
              <div className="flex-1 h-1.5 bg-white/8 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    previewPct >= 100 ? 'bg-buns-yellow' : 'bg-white/40'
                  }`}
                  style={{ width: `${Math.min(previewPct, 100)}%` }}
                />
              </div>
              <span className={`text-xs font-black tabular-nums ${previewPct >= 100 ? 'text-buns-yellow' : 'text-white/40'}`}>
                {previewPct}%
                {previewPct >= 100 && ' 🎉'}
              </span>
            </div>
          )}

          <button
            type="submit"
            disabled={billingValue === '' || billingState === 'loading'}
            className="w-full py-3 bg-buns-yellow text-black font-black text-sm uppercase tracking-wide rounded-xl disabled:opacity-30 transition active:scale-[0.98]"
          >
            {billingState === 'loading' ? 'A guardar...' : 'Actualizar faturação'}
          </button>

          {billingMsg && (
            <p className={`text-sm font-black ${billingState === 'success' ? 'text-green-400' : 'text-red-400'}`}>
              {billingMsg}
            </p>
          )}
        </form>

        {/* History */}
        {history.length > 0 && (
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 space-y-4">
            <p className="text-[11px] font-black uppercase tracking-widest text-white/35">
              Histórico de updates
            </p>
            <div className="space-y-0">
              {history.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center justify-between py-3 border-b border-white/5 last:border-0"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span
                      className={`shrink-0 text-[10px] font-black uppercase tracking-wide px-2 py-0.5 rounded-full ${
                        entry.type === 'ath_update'
                          ? 'bg-buns-orange/20 text-buns-orange'
                          : 'bg-white/10 text-white/50'
                      }`}
                    >
                      {entry.type === 'ath_update' ? 'ATH' : 'Faturação'}
                    </span>
                    {entry.label && (
                      <span className="text-xs text-white/35 truncate">{entry.label}</span>
                    )}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-black text-white text-sm">{euro(entry.value)}</p>
                    <p className="text-[10px] text-white/25 tabular-nums">
                      {new Date(entry.created_at).toLocaleString('pt-PT', {
                        day: '2-digit',
                        month: '2-digit',
                        year: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {history.length === 0 && tracker && (
          <p className="text-white/20 text-sm text-center">Sem histórico ainda.</p>
        )}

      </div>
    </main>
  )
}
