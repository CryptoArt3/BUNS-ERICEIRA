export type MenuItem = {
  id: string
  name: string
  price: number
  category: 'Burgers'|'Batatas'|'Bebidas'|'Shakes'
  desc: string
  img?: string
  tags?: string[]
}

export const MENU: MenuItem[] = [
  { id:'buns-classic', name:'BUNS Classic', price:7.9, category:'Burgers', desc:'Smash 100% novilho, cheddar derretido, cebola, pickles e molho da casa.', tags:['signature','combo'], img:'https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=1200&auto=format&fit=crop' },
  { id:'buns-bacon', name:'BUNS Bacon', price:8.9, category:'Burgers', desc:'Smash, cheddar, bacon crocante, cebola roxa e spicy mayo.', tags:['bacon','combo'], img:'https://images.unsplash.com/photo-1551782450-17144c3a8f54?q=80&w=1200&auto=format&fit=crop' },
  { id:'buns-veg', name:'BUNS Veg', price:8.5, category:'Burgers', desc:'Smash veg, queijo, pico de gallo e guacamole.', tags:['veg'], img:'https://images.unsplash.com/photo-1544025162-d76694265947?q=80&w=1200&auto=format&fit=crop' },
  { id:'fries', name:'Batata Normal', price:2.9, category:'Batatas', desc:'Crocante por fora, macia por dentro.', img:'https://images.unsplash.com/photo-1550547660-1f122e4501a9?q=80&w=1200&auto=format&fit=crop' },
  { id:'sweet-fries', name:'Batata Doce', price:3.5, category:'Batatas', desc:'Doce e crocante, vicia.', img:'https://images.unsplash.com/photo-1490818387583-1baba5e638af?q=80&w=1200&auto=format&fit=crop' },
  { id:'coke', name:'Coca-Cola 33cl', price:1.8, category:'Bebidas', desc:'Clássico refrescante.', img:'https://images.unsplash.com/photo-1606041008023-472dfb5e5303?q=80&w=1200&auto=format&fit=crop' },
  { id:'guarana', name:'Guaraná 33cl', price:1.8, category:'Bebidas', desc:'Brasil vibes.', img:'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?q=80&w=1200&auto=format&fit=crop' },
  { id:'shake-oreo', name:'Milkshake Oreo', price:3.9, category:'Shakes', desc:'Grossinho, doce, perfeito.', img:'https://images.unsplash.com/photo-1572490122747-3968b75cc699?q=80&w=1200&auto=format&fit=crop' },
]

export const SECRET_COMBOS: string[][] = [
  ['buns-classic','fries','coke'],
  ['buns-bacon','sweet-fries','shake-oreo']
]
