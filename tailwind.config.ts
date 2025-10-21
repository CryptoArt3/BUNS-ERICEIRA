import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        buns: {
          yellow: '#FFD400',
          black: '#111111',
          cream: '#F5E6D3',
          teal: '#1F8A85',
          orange: '#FF7A00',
        }
      },
      boxShadow: { buns: '0 10px 30px rgba(0,0,0,0.18)' },
      fontFamily: {
        display: ['Impact', 'Anton', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif']
      }
    },
  },
  plugins: [],
}
export default config
