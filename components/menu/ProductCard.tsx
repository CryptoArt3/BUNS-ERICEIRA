'use client'
import { motion } from 'framer-motion'
import { MenuItem } from './data'

export const ProductCard = ({
  item,
  onAdd,
}: {
  item: MenuItem
  onAdd: () => void
}) => {
  return (
    <motion.div whileHover={{ y: -4 }} className="card p-4">
      <div className="aspect-video bg-white/5 rounded-2xl flex items-center justify-center overflow-hidden">
        {item.img ? (
          <img src={item.img} alt={item.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-white/40">🍔</div>
        )}
      </div>

      <div className="mt-3">
        <h3 className="font-semibold text-lg">{item.name}</h3>
        <p className="text-white/70 text-sm line-clamp-2">{item.desc}</p>
        <div className="mt-3 flex items-center justify-between">
          <span className="font-display text-xl" style={{ color: 'var(--buns-accent)' }}>
            €{item.price.toFixed(2)}
          </span>
          <button className="btn btn-primary" onClick={onAdd}>
            Adicionar
          </button>
        </div>
      </div>
    </motion.div>
  )
}
