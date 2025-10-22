// components/menu/data.ts

/* ---------- Tipos ---------- */
export type CategoryId =
  | 'burgers'
  | 'batatas'
  | 'bebidas'
  | 'extras'
  | 'molhos'
  | 'sobremesas'

export type Product = {
  id: string
  name: string
  description?: string
  price: number
  menuPrice?: number
  image?: string
  category: CategoryId
  /** etiquetas para badges opcionais */
  tags?: Array<'veg' | 'spicy' | 'new' | 'limited'>
}

/* ---------- Categorias ---------- */
export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'burgers',    label: 'Burgers',    emoji: '🍔' },
  { id: 'batatas',    label: 'Batatas',    emoji: '🍟' },
  { id: 'bebidas',    label: 'Bebidas',    emoji: '🥤' },
  { id: 'extras',     label: 'Extras',     emoji: '➕' },
  { id: 'molhos',     label: 'Molhos',     emoji: '🧂' },
  { id: 'sobremesas', label: 'Sobremesas', emoji: '🍌' },
]

/* ---------- Produtos ---------- */
export const PRODUCTS: Product[] = [
  // Burgers
  {
    id: 'classic-bun',
    name: 'Classic Bun',
    description: 'Ketchup, mostarda, cebola e pickles.',
    price: 8.90,
    menuPrice: 12.90,
    image: '/menu/classic.jpg',
    category: 'burgers',
  },
  {
    id: 'bacon-bun',
    name: 'Bacon Bun',
    description: 'BUNS molho especial, cebola frita, bacon e alface iceberg.',
    price: 9.90,
    menuPrice: 13.90,
    image: '/menu/bacon.jpg',
    category: 'burgers',
  },
  {
    id: 'epic-bun',
    name: 'Epic Bun',
    description: 'BUNS molho especial, cebola caramelizada e jalapeños.',
    price: 9.90,
    menuPrice: 13.90,
    image: '/menu/epic.jpg',
    category: 'burgers',
    tags: ['spicy'],        // 🔥 picante
  },
  {
    id: 'veggie-bun',
    name: 'Veggie Bun',
    description: 'BUNS molho especial, Beyond Meat, cebola e alface iceberg.',
    price: 10.90,
    menuPrice: 14.90,
    image: '/menu/veggie.jpg',
    category: 'burgers',
    tags: ['veg'],          // 🌱 veggie
  },

  // Batatas
  {
    id: 'batata-normal',
    name: 'Batata Normal',
    price: 2.50,
    image: '/menu/batata-normal.jpg',
    category: 'batatas',
  },
  {
    id: 'batata-doce',
    name: 'Batata Doce',
    price: 2.50,
    image: '/menu/batata-doce.jpg',
    category: 'batatas',
  },

  // Bebidas
  {
    id: 'agua-50',
    name: 'Água 50cl',
    price: 1.50,
    image: '/menu/agua.jpg',
    category: 'bebidas',
  },
  {
    id: 'soda-20',
    name: 'Bebida com Gás 20cl',
    price: 1.50,
    image: '/menu/soda-20.jpg',
    category: 'bebidas',
  },
  {
    id: 'soda-33',
    name: 'Bebida com Gás 33cl',
    price: 2.00,
    image: '/menu/soda-33.jpg',
    category: 'bebidas',
  },
  {
    id: 'hidromel',
    name: 'Hidromel',
    price: 3.50,
    image: '/menu/hidromel.jpg',
    category: 'bebidas',
  },
  {
    id: 'cafe',
    name: 'Café',
    price: 1.00,
    image: '/menu/cafe.jpg',
    category: 'bebidas',
  },

  // Extras
  {
    id: 'extra-carne',
    name: 'Carne Extra',
    price: 2.00,
    image: '/menu/extra-carne.jpg',
    category: 'extras',
  },
  {
    id: 'extra-queijo',
    name: 'Queijo Americano',
    price: 1.00,
    image: '/menu/extra-queijo.jpg',
    category: 'extras',
  },
  {
    id: 'extra-bacon',
    name: 'Bacon Extra',
    price: 2.00,
    image: '/menu/extra-bacon.jpg',
    category: 'extras',
  },

  // Molhos
  {
    id: 'molho-especial',
    name: 'BUNS Molho Especial',
    price: 1.00,
    image: '/menu/molho-especial.jpg',
    category: 'molhos',
  },
  {
    id: 'molho-alho',
    name: 'Mayo de Alho',
    price: 1.00,
    image: '/menu/molho-alho.jpg',
    category: 'molhos',
  },
  {
    id: 'molho-picante',
    name: 'Mayo Picante',
    price: 1.00,
    image: '/menu/molho-picante.jpg',
    category: 'molhos',
  },
  {
    id: 'molho-bbq',
    name: 'Molho BBQ',
    price: 1.00,
    image: '/menu/molho-bbq.jpg',
    category: 'molhos',
  },

  // Sobremesa
  {
    id: 'frozen-bunana',
    name: 'Frozen Bunana',
    price: 3.00,
    image: '/menu/frozen-bunana.jpg',
    category: 'sobremesas',
  },
]
