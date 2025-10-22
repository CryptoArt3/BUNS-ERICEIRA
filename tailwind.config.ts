// tailwind.config.ts
import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './pages/**/*.{js,ts,jsx,tsx,mdx}', // caso venhas a usar pages/
    './lib/**/*.{js,ts,jsx,tsx,mdx}',   // utilitários, helpers, etc.
  ],

  // garante que o dark mode é controlado por classe (ex: .mode-night)
  darkMode: ['class'],

  theme: {
    extend: {
      colors: {
        buns: {
          yellow: '#FFD400',
          black: '#111111',
          cream: '#F5E6D3',
          teal: '#1F8A85',
          orange: '#FF7A00',
        },
      },
      boxShadow: {
        buns: '0 10px 30px rgba(0,0,0,0.18)',
      },
      fontFamily: {
        display: ['Impact', 'Anton', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },

  safelist: [
    // botões e elementos globais
    'btn', 'btn-primary', 'btn-ghost', 'btn-outline',
    // cores e fundos
    'text-buns-yellow', 'bg-white/5', 'border-white/10',
    // componentes visuais
    'card', 'hero', 'location-card', 'location-chip',
    // variações possíveis de modo/tema
    'mode-day', 'mode-night', 'theme-surf', 'theme-graffiti',
  ],

  plugins: [],
}

export default config
