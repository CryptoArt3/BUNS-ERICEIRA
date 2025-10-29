'use client';

import { useMemo } from 'react';
import { CartItem, FriesType, useCart } from './CartContext';

/** Ingredientes BASE por tipo de burger (podes ajustar/expandir) */
const DEFAULT_INGREDIENTS: Record<string, Record<string, boolean>> = {
  'Classic Bun': { ketchup: true, mostarda: true, cebola: true, pickles: true },
  'Bacon Bun': { 'molho especial': true, 'cebola frita': true, bacon: true, alface: true },
  'Epic Bun': { 'molho especial': true, 'cebola caramelizada': true, jalapeños: true },
  'Veggie Bun': { 'molho especial': true, 'beyond meat': true, cebola: true, alface: true },
};

const ALL_DRINKS = [
  'Coca-Cola 33cl',
  'Coca-Cola 0 33cl',
  '7up 33cl',
  'Ice Tea Limão 33cl',
  'Ice Tea Pêssego 33cl',
  'Ice Tea Manga 33cl',
  'Água 50cl',
  'Água c/ gás',
  'Super Bock 33cl',
];

export default function CartItemOptions({ item }: { item: CartItem }) {
  const { updateOptions } = useCart();

  // ingredientes iniciais por nome do produto (fallback para record vazio)
  const baseIngredients = useMemo<Record<string, boolean>>(
    () => DEFAULT_INGREDIENTS[item.name] ?? {},
    [item.name]
  );

  const ingredients = useMemo<Record<string, boolean>>(
    () => ({ ...baseIngredients, ...(item.options?.ingredients ?? {}) }),
    [baseIngredients, item.options?.ingredients]
  );

  const fries: FriesType = item.options?.fries ?? null;
  const drink: string | null = item.options?.drink ?? null;
  const note: string = item.options?.note ?? '';

  const toggleIngredient = (key: string) => {
    updateOptions(item.id, { ingredients: { [key]: !ingredients[key] } });
  };

  const setFries = (f: FriesType) => updateOptions(item.id, { fries: f });
  const setDrink = (d: string | null) => updateOptions(item.id, { drink: d });
  const setNote = (v: string) => updateOptions(item.id, { note: v });

  return (
    <div className="mt-3 space-y-3">
      {/* Ingredientes */}
      {Object.keys(ingredients).length > 0 && (
        <div>
          <div className="text-sm text-white/70 mb-1">Ingredientes</div>
          <div className="flex flex-wrap gap-2">
            {Object.keys(ingredients).map((k: string) => {
              const active = ingredients[k];
              return (
                <button
                  key={k}
                  onClick={() => toggleIngredient(k)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    active
                      ? 'bg-white/10 border-white/20'
                      : 'bg-transparent border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  {active ? '✅ ' : '🚫 '}
                  {k}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Só mostra batata & bebida quando for “menu” */}
      {item.variant === 'menu' && (
        <>
          <div>
            <div className="text-sm text-white/70 mb-1">Batatas</div>
            <div className="flex gap-2">
              <button
                onClick={() => setFries('normal')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  fries === 'normal' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                Normal
              </button>
              <button
                onClick={() => setFries('doce')}
                className={`px-3 py-1 rounded-lg text-sm ${
                  fries === 'doce' ? 'bg-white/10' : 'bg-white/5 hover:bg-white/10'
                }`}
              >
                Doce
              </button>
            </div>
          </div>

          <div>
            <div className="text-sm text-white/70 mb-1">Bebida</div>
            <div className="flex flex-wrap gap-2">
              {ALL_DRINKS.map((d: string) => (
                <button
                  key={d}
                  onClick={() => setDrink(d)}
                  className={`px-3 py-1 rounded-full text-sm border transition ${
                    drink === d
                      ? 'bg-white/10 border-white/20'
                      : 'bg-transparent border-white/10 opacity-70 hover:opacity-100'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Nota livre */}
      <div>
        <div className="text-sm text-white/70 mb-1">Nota (opcional)</div>
        <textarea
          className="w-full rounded-xl bg-white/5 border border-white/10 p-3 outline-none focus:border-white/20"
          placeholder="ex.: sem cebola, mais picante…"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
    </div>
  );
}
