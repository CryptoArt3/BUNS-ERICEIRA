// components/menu/data.ts

/* ---------- Tipos ---------- */
export type CategoryId =
  | 'burgers'
  | 'kids'
  | 'batatas'
  | 'molhos'
  | 'extras'
  | 'bunanas'
  | 'buns-bar'

export type ProductVariant = {
  id: string      // deterministic suffix: product.id + '-' + variant.id
  label: string   // shown as button label
  price?: number  // overrides base price when set
}

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
  /** option variants (size, flavour, etc.) — first is auto-selected default */
  variants?: ProductVariant[]
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

/* ---------- Categorias (display order) ---------- */
export const CATEGORIES: { id: CategoryId; label: string; emoji: string }[] = [
  { id: 'burgers',  label: 'Burgers',   emoji: '🍔' },
  { id: 'kids',     label: 'Kids',      emoji: '🧸' },
  { id: 'batatas',  label: 'Batatas',   emoji: '🍟' },
  { id: 'molhos',   label: 'Molhos',    emoji: '🧂' },
  { id: 'extras',   label: 'Extras',    emoji: '➕' },
  { id: 'bunanas',  label: 'Bunanas',   emoji: '🍌' },
  { id: 'buns-bar', label: 'BUNS Bar',  emoji: '🍺' },
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

  // ─── Batatas ─────────────────────────────────────────────
  {
    id: 'batata-normal',
    name: 'Batata Normal',
    price: 3.00,
    category: 'batatas',
  },
  {
    id: 'batata-doce',
    name: 'Batata Doce',
    price: 3.50,
    category: 'batatas',
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

  // ─── Extras ──────────────────────────────────────────────
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

  // ─── BUNS Bar ────────────────────────────────────────────

  // Soft drinks & water
  {
    id: 'agua-50',
    name: 'Água 50cl',
    price: 1.60,
    category: 'buns-bar',
  },
  {
    id: 'soda-31',
    name: 'Água Gás Pedras',
    price: 2.70,
    category: 'buns-bar',
  },
  {
    id: 'soda-33',
    name: 'Coca-Cola 33cl',
    price: 2.70,
    category: 'buns-bar',
  },
  {
    id: 'soda-38',
    name: 'Coca-Cola Zero 33cl',
    price: 2.70,
    category: 'buns-bar',
  },
  {
    id: 'soda-34',
    name: '7UP 33cl',
    price: 2.70,
    category: 'buns-bar',
  },
  {
    // Consolidated Ice Tea — 3 flavours, same price
    id: 'ice-tea',
    name: 'Ice Tea',
    price: 2.70,
    category: 'buns-bar',
    description: '33cl.',
    variants: [
      { id: 'limao',   label: 'Limão'   },
      { id: 'manga',   label: 'Manga'   },
      { id: 'pessego', label: 'Pêssego' },
    ],
  },
  {
    id: 'cafe',
    name: 'Café',
    price: 1.00,
    category: 'buns-bar',
  },

  // Draft beer
  {
    id: 'superbock-draft',
    name: 'Super Bock',
    description: 'Cerveja de pressão.',
    price: 2.50,
    category: 'buns-bar',
    variants: [
      { id: '25cl', label: '25cl', price: 2.50 },
      { id: '50cl', label: '50cl', price: 4.50 },
    ],
  },
  {
    id: 'heineken-draft',
    name: 'Heineken',
    description: 'Cerveja de pressão.',
    price: 2.50,
    category: 'buns-bar',
    variants: [
      { id: '25cl', label: '25cl', price: 2.50 },
      { id: '50cl', label: '50cl', price: 4.50 },
    ],
  },
  {
    // soda-20 repurposed to Sagres can (same price point, same category)
    id: 'soda-20',
    name: 'Sagres Lata 33cl',
    price: 2.50,
    category: 'buns-bar',
  },

  // Draft Bomb
  {
    id: 'draft-bomb',
    name: 'Draft Bomb',
    description: 'Cerveja de pressão + shot.',
    price: 3.00,
    category: 'buns-bar',
    variants: [
      { id: '25cl', label: '25cl', price: 3.00 },
      { id: '50cl', label: '50cl', price: 5.00 },
    ],
  },

  // Ready to drink / cans
  {
    id: 'lecoq-cocktail',
    name: 'Le Coq Cocktail',
    price: 4.00,
    category: 'buns-bar',
    description: 'Ready to drink 33cl.',
    variants: [
      { id: 'mojito',          label: 'Mojito Classic'    },
      { id: 'blue-lagoon',     label: 'Blue Lagoon'       },
      { id: 'margarita',       label: 'Margarita'         },
      { id: 'cosmopolitan',    label: 'Cosmopolitan'      },
      { id: 'sex-on-beach',    label: 'Sex on the Beach'  },
      { id: 'tommy-collins',   label: 'Tommy Collins'     },
      { id: 'tquila-sunrise',  label: 'T-Quila Sunrise'   },
      { id: 'cuba-libre',      label: 'Cuba Libre'        },
      { id: 'pina-colada',     label: 'Piña Colada'       },
      { id: 'lemon-spritz',    label: 'Lemon Spritz'      },
    ],
  },
  {
    id: 'hidromel',
    name: 'Hidromel',
    price: 4.50,
    category: 'buns-bar',
  },
  {
    id: 'gazela-branco',
    name: 'Gazela Vinho Branco',
    price: 3.00,
    category: 'buns-bar',
    description: '250ml.',
  },
  {
    id: 'gazela-rose',
    name: 'Gazela Vinho Rosé',
    price: 3.00,
    category: 'buns-bar',
    description: '250ml.',
  },
  {
    id: 'foxtale-gin',
    name: 'Foxtale Gin Tonic',
    price: 3.50,
    category: 'buns-bar',
    description: '250ml.',
  },
  {
    id: 'bombay-gin',
    name: 'Bombay Sapphire Gin Tonic',
    price: 4.50,
    category: 'buns-bar',
    description: '250ml.',
  },
  {
    id: 'jd-cola',
    name: "Jack Daniel's Cola",
    price: 4.00,
    category: 'buns-bar',
    description: '330ml.',
  },
  {
    id: 'martini-fiero',
    name: 'Martini Fiero Tonic',
    price: 3.50,
    category: 'buns-bar',
    description: '250ml.',
  },
  {
    id: 'eristoff-vodka',
    name: 'Eristoff Vodka',
    price: 6.50,
    category: 'buns-bar',
    description: '500ml.',
    variants: [
      { id: 'maracuja', label: 'Maracujá' },
      { id: 'limao',    label: 'Limão'    },
      { id: 'laranja',  label: 'Laranja'  },
    ],
  },

  // BUNS Night combos
  {
    id: 'buns-night',
    name: 'BUNS Night',
    price: 18.90,
    category: 'buns-bar',
    description: 'Burger + Batata + Bebida. A noite começa aqui.',
  },
  {
    id: 'bomb-night',
    name: 'Bomb Night',
    price: 6.50,
    category: 'buns-bar',
    description: 'Draft Bomb 25cl + Batata Normal.',
  },

]
