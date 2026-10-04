import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import amCommon from './locales/am/common'
import amNavigation from './locales/am/navigation'
import amAuth from './locales/am/auth'
import amSettings from './locales/am/settings'
import amValidation from './locales/am/validation'
import amOnboarding from './locales/am/onboarding'
import amMembers from './locales/am/members'
import amPeople from './locales/am/people'
import amClasses from './locales/am/classes'
import amPayments from './locales/am/payments'
import amEquipment from './locales/am/equipment'
import amAdmin from './locales/am/admin'
import amAnalytics from './locales/am/analytics'

import enCommon from './locales/en/common'
import enNavigation from './locales/en/navigation'
import enAuth from './locales/en/auth'
import enSettings from './locales/en/settings'
import enValidation from './locales/en/validation'
import enOnboarding from './locales/en/onboarding'
import enMembers from './locales/en/members'
import enPeople from './locales/en/people'
import enClasses from './locales/en/classes'
import enPayments from './locales/en/payments'
import enEquipment from './locales/en/equipment'
import enAdmin from './locales/en/admin'
import enAnalytics from './locales/en/analytics'

const namespaces = [
  'common', 'navigation', 'auth', 'settings', 'validation', 'onboarding',
  'members', 'people', 'classes', 'payments', 'equipment', 'admin', 'analytics'
]

export const LANGUAGE_STORAGE_KEY = 'ui_language'
export const SUPPORTED_LANGUAGES = ['en', 'am']

function getInitialLanguage() {
  try {
    const savedLanguage = localStorage.getItem(LANGUAGE_STORAGE_KEY)
    return SUPPORTED_LANGUAGES.includes(savedLanguage) ? savedLanguage : 'en'
  } catch {
    return 'en'
  }
}

function persistLanguage(language) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
  }

  try {
    localStorage.setItem(LANGUAGE_STORAGE_KEY, language)
  } catch {
    // Language changes still work for this session if storage is unavailable.
  }
}

const initialLanguage = getInitialLanguage()

if (typeof document !== 'undefined') {
  document.documentElement.lang = initialLanguage
}

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        navigation: enNavigation,
        auth: enAuth,
        settings: enSettings,
        validation: enValidation,
        onboarding: enOnboarding,
        members: enMembers,
        people: enPeople,
        classes: enClasses,
        payments: enPayments,
        equipment: enEquipment,
        admin: enAdmin,
        analytics: enAnalytics
      },
      am: {
        common: amCommon,
        navigation: amNavigation,
        auth: amAuth,
        settings: amSettings,
        validation: amValidation,
        onboarding: amOnboarding,
        members: amMembers,
        people: amPeople,
        classes: amClasses,
        payments: amPayments,
        equipment: amEquipment,
        admin: amAdmin,
        analytics: amAnalytics
      }
    },
    lng: initialLanguage,
    fallbackLng: 'en',
    supportedLngs: SUPPORTED_LANGUAGES,
    defaultNS: 'common',
    ns: namespaces,
    interpolation: {
      escapeValue: false
    }
  })

i18n.on('languageChanged', persistLanguage)

export default i18n
