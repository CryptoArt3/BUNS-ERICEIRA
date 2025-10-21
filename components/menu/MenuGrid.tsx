'use client'
import { useMemo, useState } from 'react'
import { MENU, MenuItem } from './data'
import { ProductCard } from './ProductCard'
import { useCart } from '@/components/cart/CartContext'

export default function MenuGrid() {
  const [filter, setFilter] = useState<'All' | MenuItem['category']>('All')
  const { add } = useCart()

  const list = useMemo(
    () => (filter === 'All' ? MENU : MENU.filter(i => i.category === filter)),
    [filter]
  )

  const cats: ('All' | MenuItem['category'])[] = ['All', 'Burgers', 'Batatas', 'Bebidas', 'Shakes']

  const handleAdd = (item: MenuItem) => {
    add({ id: item.id, name: item.name, price: item.price, qty: 1 })
  }

  return (
    <div className="mt-6">
      <div className="flex gap-2 flex-wrap">
        {cats.map(c => (
          <button
            key={c}
            className={`btn ${filter === c ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(c)}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 mt-6">
        {list.map(item => (
          <ProductCard key={item.id} item={item} onAdd={() => handleAdd(item)} />
        ))}
      </div>
    </div>
  )
}
