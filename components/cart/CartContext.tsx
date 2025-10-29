'use client';

import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

/* -------------------- Tipos -------------------- */
export type FriesType = 'normal' | 'doce' | null;

export type CartItemOptions = {
  /** ingredientes on/off, p.ex. { ketchup:true, pickles:false }  */
  ingredients?: Record<string, boolean>;
  /** batata para “menu” */
  fries?: FriesType;
  /** bebida para “menu” */
  drink?: string | null;
  /** nota livre do cliente */
  note?: string;
};

export type CartItem = {
  id: string;
  name: string;
  price: number;
  qty: number;
  /** ex.: 'burger' | 'menu' para cards com as duas variantes */
  variant?: 'burger' | 'menu';
  /** customizações */
  options?: CartItemOptions;
};

type CartState = { items: CartItem[] };

export type CartContextType = {
  cart: CartState;
  add: (item: Omit<CartItem, 'qty'> & { qty?: number }) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  /** Atualiza parcial de opções; cria options se não existir */
  updateOptions: (id: string, patch: Partial<CartItemOptions>) => void;

  /** Wrappers de conveniência (compat com o teu CartPage) */
  inc: (id: string) => void;
  dec: (id: string) => void;
  setNote: (id: string, note: string) => void;
};

const CartContext = createContext<CartContextType | null>(null);

/* -------------------- Provider -------------------- */
export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const [cart, setCart] = useState<CartState>({ items: [] });

  // carregar de localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('cart');
      if (raw) setCart(JSON.parse(raw));
    } catch {}
  }, []);
  // persistir
  useEffect(() => {
    try {
      localStorage.setItem('cart', JSON.stringify(cart));
    } catch {}
  }, [cart]);

  const add: CartContextType['add'] = (item) => {
    setCart((prev) => {
      const qty = item.qty ?? 1;
      const idx = prev.items.findIndex((it) => it.id === item.id);
      if (idx >= 0) {
        const clone = [...prev.items];
        clone[idx] = { ...clone[idx], qty: clone[idx].qty + qty };
        return { items: clone };
      }
      return { items: [...prev.items, { ...item, qty }] };
    });
  };

  const remove: CartContextType['remove'] = (id) => {
    setCart((prev) => ({ items: prev.items.filter((it) => it.id !== id) }));
  };

  const setQty: CartContextType['setQty'] = (id, qty) => {
    setCart((prev) => ({
      items: prev.items.map((it) => (it.id === id ? { ...it, qty: Math.max(1, qty) } : it)),
    }));
  };

  const clear = () => setCart({ items: [] });

  const updateOptions: CartContextType['updateOptions'] = (id, patch) => {
    setCart((prev) => ({
      items: prev.items.map((it) =>
        it.id === id
          ? {
              ...it,
              options: {
                ...(it.options ?? {}),
                ...patch,
                // merge específico para ingredients
                ...(patch.ingredients
                  ? { ingredients: { ...(it.options?.ingredients ?? {}), ...patch.ingredients } }
                  : {}),
              },
            }
          : it
      ),
    }));
  };

  /* ---------- Wrappers compat (inc, dec, setNote) ---------- */
  const inc: CartContextType['inc'] = (id) => {
    const item = cart.items.find((i) => i.id === id);
    if (item) setQty(id, item.qty + 1);
  };
  const dec: CartContextType['dec'] = (id) => {
    const item = cart.items.find((i) => i.id === id);
    if (item) setQty(id, Math.max(1, item.qty - 1));
  };
  const setNote: CartContextType['setNote'] = (id, note) => {
    updateOptions(id, { note });
  };

  const value = useMemo<CartContextType>(
    () => ({ cart, add, remove, setQty, clear, updateOptions, inc, dec, setNote }),
    [cart] // eslint-disable-line react-hooks/exhaustive-deps
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

/* -------------------- Hook -------------------- */
export const useCart = () => {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
};
