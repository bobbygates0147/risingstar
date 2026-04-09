import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  AUTH_USER_UPDATED_EVENT,
  getAuthenticatedUser,
} from '../lib/auth'
import {
  DEFAULT_LANGUAGE_CODE,
  getGoogleTranslateLanguageList,
  getStoredLanguageCode,
  LANGUAGE_CHANGED_EVENT,
  normalizeLanguageCode,
  setStoredLanguageCode,
} from '../lib/languages'

declare global {
  interface Window {
    googleTranslateElementInit?: () => void
    google?: {
      translate?: {
        TranslateElement?: new (
          options: Record<string, unknown>,
          elementId: string,
        ) => unknown
      }
    }
  }
}

const GOOGLE_TRANSLATE_SCRIPT_ID = 'google-translate-script'

function writeTranslateCookie(languageCode: string) {
  const cookieValue = `/en/${languageCode}`
  const expires =
    languageCode === DEFAULT_LANGUAGE_CODE
      ? 'Thu, 01 Jan 1970 00:00:00 GMT'
      : 'Fri, 31 Dec 9999 23:59:59 GMT'
  const hostParts = window.location.hostname.split('.')
  const isIpAddress = /^\d{1,3}(\.\d{1,3}){3}$/.test(window.location.hostname)
  const domain =
    !isIpAddress && hostParts.length > 1
      ? `;domain=.${hostParts.slice(-2).join('.')}`
      : ''

  document.cookie = `googtrans=${cookieValue};path=/;expires=${expires}`
  document.cookie = `googtrans=${cookieValue};path=/;expires=${expires}${domain}`
}

function findTranslateCombo() {
  return document.querySelector<HTMLSelectElement>('.goog-te-combo')
}

function dispatchComboChange(combo: HTMLSelectElement) {
  combo.dispatchEvent(new Event('change', { bubbles: true }))
}

function applyGoogleLanguage(languageCode: string) {
  document.documentElement.lang = languageCode

  if (languageCode === DEFAULT_LANGUAGE_CODE) {
    writeTranslateCookie(languageCode)
    const combo = findTranslateCombo()

    if (combo?.value) {
      combo.value = ''
      dispatchComboChange(combo)
    }

    return
  }

  writeTranslateCookie(languageCode)
  const combo = findTranslateCombo()

  if (!combo) {
    return
  }

  if (combo.value !== languageCode) {
    combo.value = languageCode
  }

  dispatchComboChange(combo)
}

function resolveInitialLanguage() {
  const storedLanguage = getStoredLanguageCode()
  if (storedLanguage !== DEFAULT_LANGUAGE_CODE) {
    return storedLanguage
  }

  return normalizeLanguageCode(getAuthenticatedUser()?.language)
}

export function GlobalLanguageTranslator() {
  const location = useLocation()
  const includedLanguages = useMemo(() => getGoogleTranslateLanguageList(), [])
  const [languageCode, setLanguageCode] = useState(resolveInitialLanguage)
  const [scriptReady, setScriptReady] = useState(false)

  useEffect(() => {
    setStoredLanguageCode(languageCode)
  }, [languageCode])

  useEffect(() => {
    window.googleTranslateElementInit = () => {
      if (!window.google?.translate?.TranslateElement) {
        return
      }

      new window.google.translate.TranslateElement(
        {
          pageLanguage: DEFAULT_LANGUAGE_CODE,
          includedLanguages,
          autoDisplay: false,
        },
        'google_translate_element',
      )
      setScriptReady(true)
      window.setTimeout(() => applyGoogleLanguage(languageCode), 300)
    }

    if (document.getElementById(GOOGLE_TRANSLATE_SCRIPT_ID)) {
      setScriptReady(Boolean(findTranslateCombo()))
      window.setTimeout(() => applyGoogleLanguage(languageCode), 300)
      return undefined
    }

    const script = document.createElement('script')
    script.id = GOOGLE_TRANSLATE_SCRIPT_ID
    script.async = true
    script.src =
      'https://translate.google.com/translate_a/element.js?cb=googleTranslateElementInit'
    document.body.appendChild(script)

    return () => {
      if (window.googleTranslateElementInit) {
        delete window.googleTranslateElementInit
      }
    }
  }, [includedLanguages, languageCode])

  useEffect(() => {
    function handleLanguageChanged(event: Event) {
      const nextCode = normalizeLanguageCode(
        (event as CustomEvent<{ code?: string }>).detail?.code,
      )
      setLanguageCode(nextCode)
    }

    function handleAuthUserUpdated() {
      const nextCode = normalizeLanguageCode(getAuthenticatedUser()?.language)
      setLanguageCode(nextCode)
    }

    window.addEventListener(LANGUAGE_CHANGED_EVENT, handleLanguageChanged)
    window.addEventListener(AUTH_USER_UPDATED_EVENT, handleAuthUserUpdated)

    return () => {
      window.removeEventListener(LANGUAGE_CHANGED_EVENT, handleLanguageChanged)
      window.removeEventListener(AUTH_USER_UPDATED_EVENT, handleAuthUserUpdated)
    }
  }, [])

  useEffect(() => {
    const applyTimer = window.setTimeout(() => {
      applyGoogleLanguage(languageCode)
    }, scriptReady ? 250 : 800)

    return () => {
      window.clearTimeout(applyTimer)
    }
  }, [languageCode, location.pathname, scriptReady])

  return <div id="google_translate_element" aria-hidden="true" />
}
