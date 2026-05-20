'use client'

import { useI18n } from '@/lib/i18n/useI18n'

export default function LangToggle({ className = '' }: { className?: string }) {
  const { lang, setLang } = useI18n()

  return (
    <div
      className={`inline-flex items-center h-10 bg-white/10 backdrop-blur-sm rounded-full border border-white/20 p-1 gap-0.5 ${className}`}
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
            'h-full px-2.5 rounded-full flex items-center gap-1.5 select-none whitespace-nowrap',
            'transition-all duration-150 active:scale-95',
            lang === l
              ? 'bg-buns-yellow text-black shadow-[0_0_12px_rgba(255,212,0,0.4)]'
              : 'text-white/70 hover:text-white',
          ].join(' ')}
        >
          <span className="text-sm leading-none">{l === 'pt' ? '🇵🇹' : '🇬🇧'}</span>
          <span className="text-[11px] font-black uppercase tracking-wide">{l === 'pt' ? 'PT' : 'EN'}</span>
        </button>
      ))}
    </div>
  )
}
