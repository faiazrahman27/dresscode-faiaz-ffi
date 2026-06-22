import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

import {
  COOKIE_CATEGORIES,
  acceptAllCookies,
  acceptNecessaryCookies,
  getCookieConsent,
  getCookieConsentCategories,
  hasCookieConsent,
  saveCookieConsent,
} from '../lib/cookieConsent'

const COOKIE_SETTINGS_EVENT = 'dresscode:open-cookie-settings'

const bannerMotion = {
  initial: {
    opacity: 0,
    y: 28,
    scale: 0.98,
  },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.28,
      ease: [0.22, 1, 0.36, 1],
    },
  },
  exit: {
    opacity: 0,
    y: 18,
    scale: 0.98,
    transition: {
      duration: 0.18,
      ease: [0.4, 0, 1, 1],
    },
  },
}

const preferencesMotion = {
  initial: {
    opacity: 0,
    y: 10,
    height: 0,
  },
  animate: {
    opacity: 1,
    y: 0,
    height: 'auto',
    transition: {
      duration: 0.24,
      ease: 'easeOut',
    },
  },
  exit: {
    opacity: 0,
    y: 8,
    height: 0,
    transition: {
      duration: 0.18,
      ease: 'easeIn',
    },
  },
}

function getInitialPreferences() {
  return getCookieConsentCategories()
}

function PreferenceToggle({ category, checked, onChange }) {
  const isRequired = Boolean(category.required)

  return (
    <div className="cookie-preference-row">
      <div className="cookie-preference-copy">
        <div className="cookie-preference-title-row">
          <span className="cookie-preference-title">{category.label}</span>
          {isRequired ? <span className="cookie-required-pill">Always on</span> : null}
        </div>

        <p>{category.description}</p>
      </div>

      <label className={`cookie-switch ${isRequired ? 'cookie-switch-disabled' : ''}`}>
        <input
          type="checkbox"
          checked={checked}
          disabled={isRequired}
          onChange={(event) => onChange(category.id, event.target.checked)}
        />
        <span className="cookie-switch-track">
          <span className="cookie-switch-thumb" />
        </span>
        <span className="sr-only">
          {isRequired
            ? `${category.label} cookies are always active`
            : `Toggle ${category.label} cookies`}
        </span>
      </label>
    </div>
  )
}

export default function CookieBanner() {
  const [visible, setVisible] = useState(() => !hasCookieConsent())
  const [showPreferences, setShowPreferences] = useState(false)
  const [preferences, setPreferences] = useState(getInitialPreferences)

  const categories = useMemo(() => Object.values(COOKIE_CATEGORIES), [])

  useEffect(() => {
    function openCookieSettings() {
      const consent = getCookieConsent()
      setPreferences(consent?.categories || getInitialPreferences())
      setVisible(true)
      setShowPreferences(true)
    }

    window.addEventListener(COOKIE_SETTINGS_EVENT, openCookieSettings)

    return () => {
      window.removeEventListener(COOKIE_SETTINGS_EVENT, openCookieSettings)
    }
  }, [])

  function closeBanner() {
    setVisible(false)
    setShowPreferences(false)
  }

  function handleAcceptNecessary() {
    const consent = acceptNecessaryCookies()

    if (consent) {
      setPreferences(consent.categories)
    }

    closeBanner()
  }

  function handleAcceptAll() {
    const consent = acceptAllCookies()

    if (consent) {
      setPreferences(consent.categories)
    }

    closeBanner()
  }

  function handlePreferenceChange(categoryId, value) {
    if (categoryId === 'necessary') {
      return
    }

    setPreferences((current) => ({
      ...current,
      necessary: true,
      [categoryId]: Boolean(value),
    }))
  }

  function handleSavePreferences() {
    const consent = saveCookieConsent({
      ...preferences,
      necessary: true,
    })

    if (consent) {
      setPreferences(consent.categories)
    }

    closeBanner()
  }

  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="cookie-banner"
          variants={bannerMotion}
          initial="initial"
          animate="animate"
          exit="exit"
          role="dialog"
          aria-modal="false"
          aria-labelledby="cookie-banner-title"
        >
          <div className="cookie-banner-panel">
            <div className="cookie-banner-glow" aria-hidden="true" />

            <div className="cookie-banner-main">
              <div className="cookie-banner-copy">
                <div className="eyebrow cookie-eyebrow">Privacy choices</div>

                <h2 id="cookie-banner-title" className="display cookie-banner-title">
                  Cookies and local storage
                </h2>

                <p>
                  Dresscode uses essential storage for core features such as account
                  access, security, navigation, and saving this choice. Optional
                  analytics or marketing storage is only used if you allow it.
                </p>

                <div className="cookie-banner-links" aria-label="Legal links">
                  <Link to="/cookie-policy">Cookie Policy</Link>
                  <span aria-hidden="true">·</span>
                  <Link to="/privacy-policy">Privacy Policy</Link>
                </div>
              </div>

              <div className="cookie-banner-actions">
                <button
                  type="button"
                  className="btn btn-secondary cookie-action-btn"
                  onClick={handleAcceptNecessary}
                >
                  Accept necessary
                </button>

                <button
                  type="button"
                  className="btn btn-ghost cookie-action-btn"
                  onClick={() => setShowPreferences((current) => !current)}
                  aria-expanded={showPreferences}
                >
                  Manage choices
                </button>

                <button
                  type="button"
                  className="btn btn-primary cookie-action-btn"
                  onClick={handleAcceptAll}
                >
                  Accept all
                </button>
              </div>
            </div>

            <AnimatePresence initial={false}>
              {showPreferences ? (
                <motion.div
                  className="cookie-preferences"
                  variants={preferencesMotion}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                >
                  <div className="divider cookie-preference-divider" />

                  <div className="cookie-preference-header">
                    <div>
                      <h3 className="display">Manage cookie choices</h3>
                      <p>
                        Necessary storage cannot be disabled because the site needs it
                        to work correctly. Optional categories stay off unless selected.
                      </p>
                    </div>

                    <button
                      type="button"
                      className="cookie-close-preferences"
                      onClick={() => setShowPreferences(false)}
                    >
                      Close choices
                    </button>
                  </div>

                  <div className="cookie-preference-list">
                    {categories.map((category) => (
                      <PreferenceToggle
                        key={category.id}
                        category={category}
                        checked={Boolean(preferences[category.id])}
                        onChange={handlePreferenceChange}
                      />
                    ))}
                  </div>

                  <div className="cookie-preference-actions">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={handleAcceptNecessary}
                    >
                      Necessary only
                    </button>

                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSavePreferences}
                    >
                      Save choices
                    </button>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
