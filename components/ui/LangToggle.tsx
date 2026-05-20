'use client'

import { useI18n } from '@/lib/i18n/useI18n'

export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n()

  return (
    <div
      className={`inline-flex items-center bg-black/70 backdrop-blur-sm rounded-full border border-white/15 p-0.5 ${className}`}
      role="group"
      aria-label="Language"
    >
      {(['pt', 'en'] as const).map((l) => (
        <button
          key={l}
          onClick={() => setLang(l)}
          aria-pressed={lang === l}
          aria-label={l === 'pt' ? 'Português' : 'English'}
          className={[
            'px-3 py-1.5 rounded-full text-[11px] font-black uppercase tracking-wide select-none',
            'transition-all duration-150 active:scale-95',
            lang === l
              ? 'bg-buns-yellow text-black shadow-[0_0_10px_rgba(255,212,0,0.35)]'
              : 'text-white/40 hover:text-white/80',
          ].join(' ')}
        >
          {l === 'pt' ? '🇵🇹 PT' : '🇬🇧 EN'}
        </button>
      ))}
    </div>
  )
}
