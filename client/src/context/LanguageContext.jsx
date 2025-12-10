import { createContext, useContext, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, DEFAULT_LANGUAGE } from '../config/constants'

const LanguageContext = createContext(null)

export function LanguageProvider({ children }) {
  const { i18n } = useTranslation()
  const [language, setLanguageState] = useState(i18n.language || DEFAULT_LANGUAGE)

  const setLanguage = useCallback(async (lang) => {
    if (!LANGUAGES[lang]) {
      console.warn(`Language ${lang} not supported`)
      return
    }
    
    await i18n.changeLanguage(lang)
    setLanguageState(lang)
    localStorage.setItem('language', lang)
    
    // Update document lang attribute for SEO/accessibility
    document.documentElement.lang = lang
  }, [i18n])

  const toggleLanguage = useCallback(() => {
    const newLang = language === 'fr' ? 'en' : 'fr'
    setLanguage(newLang)
  }, [language, setLanguage])

  const value = {
    language,
    setLanguage,
    toggleLanguage,
    languages: LANGUAGES,
    currentLanguage: LANGUAGES[language],
    isFrench: language === 'fr',
    isEnglish: language === 'en',
  }

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const context = useContext(LanguageContext)
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider')
  }
  return context
}

export default LanguageContext
