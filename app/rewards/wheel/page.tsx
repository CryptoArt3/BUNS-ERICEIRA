'use client'
import { useState } from 'react'
import { usePoints } from '@/components/points/PointsContext'

export default function Wheel(){
  const { addPoints } = usePoints()
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<number|null>(null)

  const spin = () => {
    const last = localStorage.getItem('buns_wheel_last')
    const today = new Date().toDateString()
    if(last === today){ alert('Já rodaste hoje! Volta amanhã 😉'); return }
    setSpinning(true)
    const prize = [5,10,15,20,25,30][Math.floor(Math.random()*6)]
    setTimeout(()=>{
      setSpinning(false)
      setResult(prize)
      addPoints(prize, 'Wheel of Perks')
      localStorage.setItem('buns_wheel_last', today)
    }, 1500)
  }

  return (
    <main className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-display">Wheel of Perks</h2>
      <p className="text-white/70">Roda uma vez por dia e ganha XP.</p>
      <div className="mt-6 card p-8 flex flex-col items-center">
        <div className={`rounded-full w-48 h-48 flex items-center justify-center text-3xl border-4 border-white/20 ${spinning? 'animate-spin' : ''}`}>🎯</div>
        <button className="btn btn-primary mt-6" onClick={spin} disabled={spinning}>{spinning? 'A rodar...' : 'Rodar'}</button>
        {result && <p className="mt-4">Ganhaste <span className="text-buns-yellow font-bold">{result} XP</span>! 🔥</p>}
      </div>
    </main>
  )
}
