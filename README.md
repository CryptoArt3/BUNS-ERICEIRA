# BUNS Digital Menu

1) `npm install`
2) `npm run dev`
3) Abrir `http://localhost:3000`

Screen API local:
- definir `SCREEN_API_BASE_URL=http://127.0.0.1:8000` em `.env.local`
- a rota `/api/screen` usa `SCREEN_API_BASE_URL` primeiro
- fallback compatível: `AGENT_API_BASE_URL` e `NEXT_PUBLIC_AGENT_API_BASE_URL`
- fallback de segurança fora de produção: `http://127.0.0.1:8000`

Stack: Next.js 14 + Tailwind + framer-motion
