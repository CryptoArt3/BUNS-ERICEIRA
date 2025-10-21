'use client'
import Link from 'next/link'
import { usePoints } from '@/components/points/PointsContext'

export default function Rewards(){
  const { points, badges } = usePoints()

  return (
    <main className="container mx-auto px-4 py-8">
      <h2 className="text-3xl font-display">Recompensas</h2>
      <p className="text-white/80">XP atual: <span className="text-buns-yellow font-bold">{points}</span></p>
      <Link href="/rewards/wheel" className="btn btn-primary mt-4 inline-block">Wheel of Perks</Link>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {badges.map((b) => (
          <div key={b.id} className="card p-5">
            <h3 className="font-semibold text-lg">{b.title}</h3>
            <p className="text-white/70 text-sm">{b.desc}</p>
            <p className="mt-2 text-xs text-white/50">Desbloqueado: {new Date(b.when).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </main>
  )
}
