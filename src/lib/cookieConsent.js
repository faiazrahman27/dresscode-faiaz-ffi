const CONSENT_VERSION = 1

export const COOKIE_CONSENT_STORAGE_KEY = 'dresscode_cookie_consent'
export const COOKIE_CONSENT_EVENT = 'dresscode:cookie-consent-updated'

export const COOKIE_CATEGORIES = {
  necessary: {
    id: 'necessary',
    label: 'Strictly necessary',
    description:
      'Required for core site functions such as authentication, account access, security, navigation, and saving your cookie preference.',
    required: true,
  },
  analytics: {
    id: 'analytics',
    label: 'Analytics',
    description:
      'Helps understand how visitors use Dresscode so the product can be improved. This is optional and stays off unless accepted.',
    required: false,
  },
  marketing: {
    id: 'marketing',
    label: 'Marketing',
    description:
      'May be used for campaign measurement or promotional features in the future. This is optional and stays off unless accepted.',
    required: false,
  },
}

const DEFAULT_CATEGORIES = {
  necessary: true,
  analytics: false,
  marketing: false,
}

function isBrowser() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function getTimestamp() {
  return new Date().toISOString()
}

function normalizeCategories(categories = {}) {
  return {
    necessary: true,
    analytics: Boolean(categories.analytics),
    marketing: Boolean(categories.marketing),
  }
}

function buildConsentRecord(categories = {}, existingRecord = null) {
  const now = getTimestamp()

  return {
    version: CONSENT_VERSION,
    categories: normalizeCategories(categories),
    createdAt: existingRecord?.createdAt || now,
    updatedAt: now,
  }
}

function safelyParseConsent(value) {
  if (!value) return null

  try {
    const parsed = JSON.parse(value)

    if (!parsed || typeof parsed !== 'object') {
      return null
    }

    return buildConsentRecord(parsed.categories, parsed)
  } catch {
    return null
  }
}

function notifyConsentChange(consent) {
  if (!isBrowser()) return

  window.dispatchEvent(
    new CustomEvent(COOKIE_CONSENT_EVENT, {
      detail: { consent },
    }),
  )
}

export function getDefaultCookieConsent() {
  return buildConsentRecord(DEFAULT_CATEGORIES)
}

export function getCookieConsent() {
  if (!isBrowser()) {
    return null
  }

  const storedConsent = window.localStorage.getItem(COOKIE_CONSENT_STORAGE_KEY)
  return safelyParseConsent(storedConsent)
}

export function hasCookieConsent() {
  return Boolean(getCookieConsent())
}

export function saveCookieConsent(categories) {
  if (!isBrowser()) {
    return null
  }

  const existingConsent = getCookieConsent()
  const consent = buildConsentRecord(categories, existingConsent)

  window.localStorage.setItem(COOKIE_CONSENT_STORAGE_KEY, JSON.stringify(consent))
  notifyConsentChange(consent)

  return consent
}

export function acceptNecessaryCookies() {
  return saveCookieConsent({
    necessary: true,
    analytics: false,
    marketing: false,
  })
}

export function acceptAllCookies() {
  return saveCookieConsent({
    necessary: true,
    analytics: true,
    marketing: true,
  })
}

export function rejectOptionalCookies() {
  return acceptNecessaryCookies()
}

export function clearCookieConsent() {
  if (!isBrowser()) {
    return
  }

  window.localStorage.removeItem(COOKIE_CONSENT_STORAGE_KEY)
  notifyConsentChange(null)
}

export function hasCookieCategoryConsent(categoryId) {
  const consent = getCookieConsent()

  if (categoryId === 'necessary') {
    return true
  }

  return Boolean(consent?.categories?.[categoryId])
}

export function getCookieConsentCategories() {
  return getCookieConsent()?.categories || DEFAULT_CATEGORIES
}

export function onCookieConsentChange(callback) {
  if (!isBrowser() || typeof callback !== 'function') {
    return () => {}
  }

  const handleConsentEvent = (event) => {
    callback(event.detail?.consent || getCookieConsent())
  }

  const handleStorageEvent = (event) => {
    if (event.key === COOKIE_CONSENT_STORAGE_KEY) {
      callback(safelyParseConsent(event.newValue))
    }
  }

  window.addEventListener(COOKIE_CONSENT_EVENT, handleConsentEvent)
  window.addEventListener('storage', handleStorageEvent)

  return () => {
    window.removeEventListener(COOKIE_CONSENT_EVENT, handleConsentEvent)
    window.removeEventListener('storage', handleStorageEvent)
  }
}
