// components/menu/data.ts

/* ---------- Tipos ---------- */
export type CategoryId =
  | 'burgers'
  | 'extras'
  | 'bebidas'
  | 'molhos'
  | 'bunanas'
  | 'kids'

export type Product = {
  id: string
  name: string
  description?: string
  price: number
  menuPrice?: number
  image?: string
  category: CategoryId
  tags?: Array<'veg' | 'spicy' | 'new' | 'limited' | 'bestseller'>
  ingredients?: string[]
}

/* ---------- Opções globais para "Menu" ---------- */
export const FRIES_OPTIONS = [
  'Batata Normal',
  'Batata Doce',
] as const

export const DRINK_OPTIONS = [
  'Coca-Cola',
  'Coca-Cola Zero',
  '7UP',
  'Ice Tea Limão',
  'Ice Tea Pêssego',
  'Ice Tea Manga',
  'Super Bock',
  'Água',
  'Água com gás',
] as const

/* ---------- Categorias ---------- */
export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'burgers',  label: 'Burgers',  emoji: '🍔' },
  { id: 'extras',   label: 'Extras',   emoji: '🍟' },
  { id: 'bebidas',  label: 'Bebidas',  emoji: '🥤' },
  { id: 'molhos',   label: 'Molhos',   emoji: '🧂' },
  { id: 'bunanas',  label: 'Bunanas',  emoji: '🍌' },
  { id: 'kids',     label: 'Kids',     emoji: '🧸' },
]

/* ---------- Produtos ---------- */
export const PRODUCTS: Product[] = [

  // ─── Burgers ─────────────────────────────────────────────
  {
    id: 'classic-bun',
    name: 'Classic Bun',
    price: 9.90,
    menuPrice: 13.90,
    category: 'burgers',
    ingredients: ['Queijo americano', 'Ketchup', 'Mostarda', 'Cebola', 'Pickles'],
  },
  {
    id: 'bacon-bun',
    name: 'Bacon Bun',
    price: 9.90,
    menuPrice: 13.90,
    category: 'burgers',
    tags: ['bestseller'],
    ingredients: ['BUNS molho especial', 'Cebola frita', 'Bacon', 'Alface iceberg'],
  },
  {
    id: 'epic-bun',
    name: 'Epic Bun',
    price: 9.90,
    menuPrice: 13.90,
    category: 'burgers',
    tags: ['spicy'],
    ingredients: ['BUNS molho especial', 'Cebola caramelizada', 'Jalapeños'],
  },
  {
    id: 'veggie-bun',
    name: 'Veggie Bun',
    price: 10.90,
    menuPrice: 14.90,
    category: 'burgers',
    tags: ['veg'],
    ingredients: ['BUNS molho especial', 'Beyond Meat', 'Cebola', 'Alface iceberg'],
  },
  {
    id: 'chicken-bun',
    name: 'Chicken Bun',
    price: 9.90,
    menuPrice: 13.90,
    category: 'burgers',
    tags: ['new'],
    ingredients: ['Frango crocante', 'Coleslaw', 'Mayo de alho', 'Pickles'],
  },

  // ─── Extras ──────────────────────────────────────────────
  {
    id: 'batata-normal',
    name: 'Batata Normal',
    price: 3.00,
    category: 'extras',
  },
  {
    id: 'batata-doce',
    name: 'Batata Doce',
    price: 3.50,
    category: 'extras',
  },
  {
    id: 'extra-carne',
    name: 'Extra Beef',
    price: 2.80,
    category: 'extras',
  },
  {
    id: 'extra-queijo',
    name: 'Extra Cheese',
    price: 1.20,
    category: 'extras',
  },
  {
    id: 'extra-bacon',
    name: 'Extra Bacon',
    price: 2.80,
    category: 'extras',
  },
  {
    id: 'extra-molho',
    name: 'Extra Molho',
    price: 1.10,
    category: 'extras',
  },

  // ─── Bebidas ─────────────────────────────────────────────
  {
    id: 'agua-50',
    name: 'Água 50cl',
    price: 1.60,
    category: 'bebidas',
  },
  {
    id: 'soda-20',
    name: 'Super Bock 33cl',
    price: 2.50,
    category: 'bebidas',
  },
  {
    id: 'soda-31',
    name: 'Água Gás Pedras',
    price: 2.70,
    category: 'bebidas',
  },
  {
    id: 'soda-33',
    name: 'Coca-Cola 33cl',
    price: 2.70,
    category: 'bebidas',
  },
  {
    id: 'soda-34',
    name: '7UP 33cl',
    price: 2.70,
    category: 'bebidas',
  },
  {
    id: 'soda-35',
    name: 'Ice Tea Manga 33cl',
    price: 2.70,
    category: 'bebidas',
  },
  {
    id: 'soda-36',
    name: 'Ice Tea Limão 33cl',
    price: 2.70,
    category: 'bebidas',
  },
  {
    id: 'soda-37',
    name: 'Ice Tea Pêssego 33cl',
    price: 2.70,
    category: 'bebidas',
  },
  {
    id: 'soda-38',
    name: 'Coca-Cola Zero 33cl',
    price: 2.70,
    category: 'bebidas',
  },
  {
    id: 'hidromel',
    name: 'Hidromel',
    price: 3.50,
    category: 'bebidas',
  },
  {
    id: 'cafe',
    name: 'Café',
    price: 1.00,
    category: 'bebidas',
  },

  // ─── Molhos ──────────────────────────────────────────────
  {
    id: 'molho-especial',
    name: 'BUNS Molho Especial',
    price: 1.10,
    category: 'molhos',
  },
  {
    id: 'molho-alho',
    name: 'Mayo de Alho',
    price: 1.10,
    category: 'molhos',
  },
  {
    id: 'molho-picante',
    name: 'Mayo Picante',
    price: 1.10,
    category: 'molhos',
    tags: ['spicy'],
  },
  {
    id: 'molho-bbq',
    name: 'Molho BBQ',
    price: 1.10,
    category: 'molhos',
  },
  {
    id: 'molho-pack-3',
    name: 'Pack 3 Molhos',
    price: 2.50,
    category: 'molhos',
    description: 'Escolhe 3 molhos à tua escolha.',
  },
  {
    id: 'molho-pack-5',
    name: 'Pack 5 Molhos',
    price: 4.00,
    category: 'molhos',
    description: 'Escolhe 5 molhos à tua escolha.',
  },

  // ─── Bunanas ─────────────────────────────────────────────
  {
    id: 'frozen-bunana',
    name: 'Buns Milk Simple',
    description: 'Banana congelada com cobertura de chocolate de leite.',
    price: 3.00,
    category: 'bunanas',
  },
  {
    id: 'frozen-bunana2',
    name: 'Buns White Simple',
    description: 'Banana congelada com cobertura de chocolate branco.',
    price: 3.00,
    category: 'bunanas',
  },
  {
    id: 'frozen-bunana3',
    name: 'Dark Oreo',
    description: 'Banana congelada, chocolate negro e Oreo.',
    price: 3.50,
    category: 'bunanas',
  },
  {
    id: 'frozen-bunana4',
    name: 'Cookie Bomb',
    description: 'Banana congelada, cookie crocante e caramelo.',
    price: 3.50,
    category: 'bunanas',
  },
  {
    id: 'bunana-pack-3',
    name: 'Pack 3 Bunanas',
    price: 9.90,
    category: 'bunanas',
    description: 'Escolhe 3 bunanas à tua escolha.',
  },
  {
    id: 'bunana-pack-5',
    name: 'Pack 5 Bunanas',
    price: 15.90,
    category: 'bunanas',
    description: 'Escolhe 5 bunanas à tua escolha.',
  },

  // ─── Kids ────────────────────────────────────────────────
  {
    id: 'kids-bun',
    name: 'Kids Bun Menu',
    price: 12.00,
    category: 'kids',
    description: 'Smash burger kids + batata + bebida. Perfeito para os mais novos.',
    ingredients: ['Queijo americano', 'Ketchup', 'Mostarda'],
  },
  {
    id: 'happy-bun',
    name: 'Happy Bun Menu',
    price: 13.90,
    category: 'kids',
    description: 'Smash burger kids especial + batata + bebida + bunana.',
    ingredients: ['Queijo americano', 'BUNS molho especial', 'Cebola'],
  },

]
