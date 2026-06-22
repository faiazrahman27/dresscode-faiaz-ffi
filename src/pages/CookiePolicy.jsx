import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const lastUpdated = '22 June 2026'
const COOKIE_SETTINGS_EVENT = 'dresscode:open-cookie-settings'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const heroStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

const storageCategories = [
  {
    title: 'Strictly necessary storage',
    status: 'Always active',
    purpose:
      'Required for authentication, account access, security, navigation, QR activation flows, and saving your cookie preference.',
    examples:
      'Login/session storage, security-related storage, route state, and cookie preference storage.',
  },
  {
    title: 'Analytics storage',
    status: 'Optional',
    purpose:
      'May help us understand how visitors use Dresscode, which pages are useful, and where the product experience can be improved.',
    examples:
      'Aggregated page usage, feature interaction, scan-performance signals, or similar measurement tools if enabled.',
  },
  {
    title: 'Marketing storage',
    status: 'Optional',
    purpose:
      'May support campaign measurement, audience understanding, or promotional features if Dresscode adds those tools in the future.',
    examples:
      'Campaign attribution or promotional measurement tools if enabled.',
  },
]

const preferenceSteps = [
  'Use the cookie banner when it appears.',
  'Choose “Accept necessary,” “Accept all,” or “Manage choices.”',
  'Change optional analytics or marketing choices from the preference panel.',
  'Use the “Manage cookie choices” button on this page to reopen the panel later.',
]

function GlitterField({ count = 16 }) {
  return (
    <div className="glitter-field" aria-hidden="true">
      {Array.from({ length: count }).map((_, i) => (
        <span
          key={i}
          className="glitter-dot"
          style={{
            left: `${(i * 9 + 7) % 100}%`,
            top: `${(i * 11 + 13) % 100}%`,
            animationDelay: `${(i % 9) * 0.55}s`,
            animationDuration: `${4.2 + (i % 5)}s`,
          }}
        />
      ))}
    </div>
  )
}

function LegalSection({ eyebrow, title, children }) {
  return (
    <motion.section
      className="legal-section surface-card"
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.16 }}
      transition={{ duration: 0.45 }}
    >
      {eyebrow ? <div className="eyebrow mb-4">{eyebrow}</div> : null}
      <h2 className="legal-section-title display">{title}</h2>
      <div className="legal-copy">{children}</div>
    </motion.section>
  )
}

function openCookieSettings() {
  window.dispatchEvent(new Event(COOKIE_SETTINGS_EVENT))
}

export default function CookiePolicy() {
  return (
    <div className="app-shell legal-page min-h-screen bg-[#0A1F1F] text-white">
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="legal-bg-orb legal-bg-orb-1" />
      <div className="legal-bg-orb legal-bg-orb-2" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <section className="relative overflow-hidden px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <motion.div
            className="legal-hero"
            variants={heroStagger}
            initial="hidden"
            animate="visible"
          >
            <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
              <div className="eyebrow mb-5">Legal</div>
            </motion.div>

            <motion.h1
              className="section-title mb-5"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              Cookie Policy
            </motion.h1>

            <motion.p
              className="lead legal-hero-lead mb-6"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              This Cookie Policy explains how Dresscode uses cookies, local storage,
              and similar browser technologies. It also explains how you can control
              optional storage choices.
            </motion.p>

            <motion.div
              className="legal-meta-row"
              variants={fadeUp}
              transition={{ duration: 0.45 }}
            >
              <span>Last updated: {lastUpdated}</span>
              <span>Applies to Dresscode and dresscode.bio</span>
            </motion.div>
          </motion.div>

          <motion.div
            className="legal-cookie-control surface-card mt-10"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div>
              <div className="eyebrow mb-3">Your controls</div>
              <h2 className="display">Manage cookie choices</h2>
              <p>
                You can reopen the cookie preference panel at any time and change
                optional analytics or marketing choices.
              </p>
            </div>

            <button type="button" className="btn btn-primary glow-btn" onClick={openCookieSettings}>
              Manage cookie choices
            </button>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-16 md:pb-24">
        <div className="container max-w-5xl">
          <div className="legal-content-stack">
            <LegalSection eyebrow="1" title="What this policy covers">
              <p>
                Cookies and similar browser technologies are small pieces of data that
                can be stored on your device or read from your browser when you use a
                website. Dresscode may use cookies, local storage, session storage, or
                similar technologies depending on the feature.
              </p>

              <p>
                Some storage is strictly necessary for the platform to work. Optional
                analytics or marketing storage should only be used when you allow it.
              </p>
            </LegalSection>

            <LegalSection eyebrow="2" title="Storage categories we use">
              <p>
                Dresscode groups browser storage into the categories below. We keep the
                wording clear instead of exposing sensitive internal implementation
                details.
              </p>

              <div className="legal-card-list">
                {storageCategories.map((category) => (
                  <article key={category.title} className="legal-info-card">
                    <div className="legal-card-heading-row">
                      <h3>{category.title}</h3>
                      <span>{category.status}</span>
                    </div>

                    <p>{category.purpose}</p>

                    <div className="legal-mini-note">
                      <strong>Examples:</strong> {category.examples}
                    </div>
                  </article>
                ))}
              </div>
            </LegalSection>

            <LegalSection eyebrow="3" title="Strictly necessary storage">
              <p>
                Strictly necessary storage is required for core platform functions. You
                cannot disable it through the cookie banner because the site may not
                work correctly without it.
              </p>

              <p>Necessary storage may support:</p>

              <ul>
                <li>Account login and authentication.</li>
                <li>Session continuity and dashboard access.</li>
                <li>QR activation and profile navigation flows.</li>
                <li>Security, abuse prevention, and platform integrity.</li>
                <li>Saving your cookie preference so we do not ask repeatedly.</li>
              </ul>
            </LegalSection>

            <LegalSection eyebrow="4" title="Analytics storage">
              <p>
                Analytics storage is optional. It may be used to understand how the
                platform is used, which pages are visited, how public QR experiences
                perform, and where the user experience can be improved.
              </p>

              <p>
                Analytics should be configured in a privacy-conscious way and should
                not be used unless accepted where consent is required.
              </p>
            </LegalSection>

            <LegalSection eyebrow="5" title="Marketing storage">
              <p>
                Marketing storage is optional. Dresscode may use it in the future to
                measure campaigns, understand promotional performance, or support
                marketing-related features.
              </p>

              <p>
                Marketing storage is not needed to use the core platform and should
                remain off unless accepted where consent is required.
              </p>
            </LegalSection>

            <LegalSection eyebrow="6" title="Third-party tools">
              <p>
                Some platform features may rely on service providers for hosting,
                authentication, storage, email delivery, contact forms, security, or
                product functionality. These providers may use cookies or similar
                technologies where necessary to provide their services.
              </p>

              <p>
                If Dresscode adds optional analytics, advertising, embedded media, or
                third-party measurement tools, the cookie preference system and this
                policy should be updated to describe those tools clearly.
              </p>
            </LegalSection>

            <LegalSection eyebrow="7" title="How to manage your choices">
              <p>
                You can manage optional storage choices through the cookie banner or
                from this page.
              </p>

              <ol>
                {preferenceSteps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>

              <p>
                You can also delete cookies and local storage through your browser
                settings. If you do this, some platform settings may reset and you may
                need to sign in again.
              </p>
            </LegalSection>

            <LegalSection eyebrow="8" title="Changes to this policy">
              <p>
                We may update this Cookie Policy if Dresscode adds new features,
                changes service providers, or introduces new cookies or similar
                technologies. The updated version will be posted on this page with a
                new “Last updated” date.
              </p>
            </LegalSection>

            <LegalSection eyebrow="9" title="Contact">
              <p>
                For questions about cookies, local storage, privacy, or data choices,
                contact <a href="mailto:hello@dresscode.bio">hello@dresscode.bio</a>.
              </p>

              <p>
                You can also read our <Link to="/privacy-policy">Privacy Policy</Link>{' '}
                for more detail about how Dresscode handles personal data.
              </p>
            </LegalSection>

            <div className="legal-bottom-nav">
              <Link to="/privacy-policy" className="btn btn-secondary">
                Privacy Policy
              </Link>
              <Link to="/terms-of-service" className="btn btn-primary glow-btn">
                Terms of Service
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
