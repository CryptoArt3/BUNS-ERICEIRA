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
    image: '/menu/classic.png',
    category: 'burgers',
  },
  {
    id: 'bacon-bun',
    name: 'Bacon Bun',
    description: 'BUNS molho especial, cebola frita, bacon e alface iceberg.',
    price: 9.90,
    menuPrice: 13.90,
    image: '/menu/bacon.png',
    category: 'burgers',
  },
  {
    id: 'epic-bun',
    name: 'Epic Bun',
    description: 'BUNS molho especial, cebola caramelizada e jalapeños.',
    price: 9.90,
    menuPrice: 13.90,
    image: '/menu/epic.png',
    category: 'burgers',
    tags: ['spicy'],        // 🔥 picante
  },
  {
    id: 'veggie-bun',
    name: 'Veggie Bun',
    description: 'BUNS molho especial, Beyond Meat, cebola e alface iceberg.',
    price: 10.90,
    menuPrice: 14.90,
    image: '/menu/veggie.png',
    category: 'burgers',
    tags: ['veg'],          // 🌱 veggie
  },

  // Batatas
  {
    id: 'batata-normal',
    name: 'Batata Normal',
    price: 2.50,
    image: '/menu/batata-normal.png',
    category: 'batatas',
  },
  {
    id: 'batata-doce',
    name: 'Batata Doce',
    price: 2.50,
    image: '/menu/batata-doce.png',
    category: 'batatas',
  },

  // Bebidas
  {
    id: 'agua-50',
    name: 'Água 50cl',
    price: 1.50,
    image: '/menu/agua.png',
    category: 'bebidas',
  },
  {
    id: 'soda-20',
    name: 'Super Bock 33CL',
    price: 2.00,
    image: '/menu/super-bock-33cl.png',
    category: 'bebidas',
  },
  {
    id: 'soda-31',
    name: 'Água gás Pedras',
    price: 2.50,
    image: '/menu/agua-gas.png',
    category: 'bebidas',
  },
  {
    id: 'soda-33',
    name: 'Coca-Cola 33cl',
    price: 2.50,
    image: '/menu/coca-cola.png',
    category: 'bebidas',
  },
  {
    id: 'soda-34',
    name: '7up 33cl',
    price: 2.50,
    image: '/menu/7up.png',
    category: 'bebidas',
  },
  {
    id: 'soda-35',
    name: 'Ice Tea Manga 33cl',
    price: 2.50,
    image: '/menu/ice-tea-manga.png',
    category: 'bebidas',
  },
  {
    id: 'soda-36',
    name: 'Ice Tea limão 33cl',
    price: 2.50,
    image: '/menu/ice-tea-limao.png',
    category: 'bebidas',
  },
  {
    id: 'soda-37',
    name: 'Ice Tea Pessego 33cl',
    price: 2.50,
    image: '/menu/ice-tea-pessego.png',
    category: 'bebidas',
  },
  {
    id: 'soda-38',
    name: 'Coca-Cola 0 33cl',
    price: 2.50,
    image: '/menu/coca-cola-0.png',
    category: 'bebidas',
  },
  {
    id: 'hidromel',
    name: 'Hidromel',
    price: 3.50,
    image: '/menu/hidromel.png',
    category: 'bebidas',
  },
  {
    id: 'cafe',
    name: 'Café',
    price: 1.00,
    image: '/menu/cafe.png',
    category: 'bebidas',
  },

  // Extras
  {
    id: 'extra-carne',
    name: 'Carne Extra',
    price: 2.00,
    image: '/menu/extra-carne.png',
    category: 'extras',
  },
  {
    id: 'extra-queijo',
    name: 'Queijo Americano',
    price: 1.00,
    image: '/menu/extra-queijo.png',
    category: 'extras',
  },
  {
    id: 'extra-bacon',
    name: 'Bacon Extra',
    price: 2.00,
    image: '/menu/extra-bacon.png',
    category: 'extras',
  },

  // Molhos
  {
    id: 'molho-especial',
    name: 'BUNS Molho Especial',
    price: 1.00,
    image: '/menu/molho-especial.png',
    category: 'molhos',
  },
  {
    id: 'molho-alho',
    name: 'Mayo de Alho',
    price: 1.00,
    image: '/menu/molho-alho.png',
    category: 'molhos',
  },
  {
    id: 'molho-picante',
    name: 'Mayo Picante',
    price: 1.00,
    image: '/menu/molho-picante.png',
    category: 'molhos',
  },
  {
    id: 'molho-bbq',
    name: 'Molho BBQ',
    price: 1.00,
    image: '/menu/molho-bbq.png',
    category: 'molhos',
  },

  // Sobremesa
  {
    id: 'frozen-bunana',
    name: 'Bunana Classic Bun',
    price: 3.00,
    image: '/menu/frozen-bunana-classic.png',
    category: 'sobremesas',
  },
  {
    id: 'frozen-bunana2',
    name: 'Buns White Dream',
    price: 3.00,
    image: '/menu/white-dream.png',
    category: 'sobremesas',
  },
  {
    id: 'frozen-bunana3',
    name: 'Buns Dark Oreo',
    price: 3.00,
    image: '/menu/dark-oreo.png',
    category: 'sobremesas',
  },
  {
    id: 'frozen-bunana4',
    name: 'Buns Cookie Bomb',
    price: 3.00,
    image: '/menu/cookie-bomb.png',
    category: 'sobremesas',
  },
]
