'use client'

import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { translations, type LangKey } from './translations'

const STORAGE_KEY = 'buns_lang'

type I18nCtx = {
  lang:    LangKey
  setLang: (l: LangKey) => void
  t:       (key: string) => string
}

export const I18nContext = createContext<I18nCtx>({
  lang:    'pt',
  setLang: () => {},
  t:       (k) => k,
})

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<LangKey>('pt')

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as LangKey | null
    if (saved === 'pt' || saved === 'en') {
      setLangState(saved)
    } else {
      // First visit: honour browser language, default PT
      const detected = navigator.language?.slice(0, 2).toLowerCase() === 'en' ? 'en' : 'pt'
      setLangState(detected as LangKey)
      localStorage.setItem(STORAGE_KEY, detected)
    }
  }, [])

  /* Update <html lang> attribute */
  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  function setLang(l: LangKey) {
    setLangState(l)
    localStorage.setItem(STORAGE_KEY, l)
  }

  function t(key: string): string {
    return translations[lang]?.[key] ?? translations.pt[key] ?? key
  }

  return (
    <I18nContext.Provider value={{ lang, setLang, t }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n(): I18nCtx {
  return useContext(I18nContext)
}
