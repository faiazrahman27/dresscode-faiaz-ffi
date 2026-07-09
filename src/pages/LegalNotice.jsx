import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

const lastUpdated = '22 June 2026'

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

const noticeItems = [
  {
    label: 'Platform',
    value: 'Dresscode',
  },
  {
    label: 'Website',
    value: 'dresscode.bio',
  },
  {
    label: 'Contact',
    value: 'admin@dresscode.bio',
    href: 'mailto:admin@dresscode.bio',
  },
]

const contactReasons = [
  'Legal notices and rights requests',
  'Privacy or data protection questions',
  'Platform safety and misuse reports',
  'Content, copyright, or trademark concerns',
  'Business, brand, or partnership inquiries',
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

export default function LegalNotice() {
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
              Legal Notice
            </motion.h1>

            <motion.p
              className="lead legal-hero-lead mb-6"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              This Legal Notice provides public contact routes for legal, privacy,
              safety, rights-related, and business requests connected to Dresscode.
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
            className="legal-notice-card surface-card mt-10"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.45, delay: 0.1 }}
          >
            <div>
              <div className="eyebrow mb-3">Platform contact</div>
              <h2 className="display">Dresscode contact details</h2>
              <p>
                Use these details for formal notices, privacy requests, rights
                concerns, safety reports, or business communication.
              </p>
            </div>

            <div className="legal-notice-grid">
              {noticeItems.map((item) => (
                <div key={item.label} className="legal-notice-item">
                  <span>{item.label}</span>
                  {item.href ? <a href={item.href}>{item.value}</a> : <strong>{item.value}</strong>}
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-16 md:pb-24">
        <div className="container max-w-5xl">
          <div className="legal-content-stack">
            <LegalSection eyebrow="1" title="About Dresscode">
              <p>
                Dresscode is a wearable media and QR identity platform that connects
                physical garments, products, collectibles, campaigns, or other items
                to public digital profiles and storytelling pages.
              </p>

              <p>
                Dresscode may include public profile pages, QR activation flows,
                account dashboards, product storytelling, scan experiences, and related
                platform features.
              </p>
            </LegalSection>

            <LegalSection eyebrow="2" title="Contact routes">
              <p>
                You can contact Dresscode at{' '}
                <a href="mailto:admin@dresscode.bio">admin@dresscode.bio</a> for:
              </p>

              <ul>
                {contactReasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>

              <p>
                Please include enough information for us to understand and verify your
                request. For privacy or account-related requests, we may need to verify
                that you are the account holder or legally authorized to act on their
                behalf.
              </p>
            </LegalSection>

            <LegalSection eyebrow="3" title="Hosting and technical service providers">
              <p>
                Dresscode may use third-party service providers for hosting,
                authentication, storage, email delivery, contact forms, platform
                security, and related operational functions.
              </p>

              <p>
                We describe service-provider categories clearly without publishing
                sensitive technical or security details that could weaken the platform.
                More information about data handling is available in the{' '}
                <Link to="/privacy-policy">Privacy Policy</Link>.
              </p>
            </LegalSection>

            <LegalSection eyebrow="4" title="Content, copyright, and trademark concerns">
              <p>
                If you believe that content on Dresscode infringes your copyright,
                trademark, image rights, privacy rights, or other legal rights, contact
                us with a clear description of the issue.
              </p>

              <p>Please include:</p>

              <ul>
                <li>The URL or QR-connected page where the content appears.</li>
                <li>A description of the content or material at issue.</li>
                <li>Your name and contact details.</li>
                <li>The rights you believe are affected.</li>
                <li>Any information showing that you own the rights or are authorized to act for the rights holder.</li>
              </ul>

              <p>
                We may remove, restrict, or review content where we reasonably believe
                it violates rights, creates legal risk, breaches our Terms of Service,
                or misuses the platform.
              </p>
            </LegalSection>

            <LegalSection eyebrow="5" title="Platform safety and misuse reports">
              <p>
                Report suspected unauthorized QR activation, impersonation, harmful
                content, phishing, spam, misleading product claims, abuse, or security
                concerns to <a href="mailto:admin@dresscode.bio">admin@dresscode.bio</a>.
              </p>

              <p>
                Do not publicly disclose sensitive vulnerability details before giving
                us a reasonable opportunity to investigate and respond.
              </p>
            </LegalSection>

            <LegalSection eyebrow="6" title="No emergency service">
              <p>
                Dresscode is not an emergency reporting service. If you believe there
                is immediate danger, contact local emergency services or the relevant
                authority.
              </p>
            </LegalSection>

            <LegalSection eyebrow="7" title="Legal documents">
              <p>
                This Legal Notice should be read together with the documents below:
              </p>

              <div className="legal-document-links">
                <Link to="/privacy-policy">Privacy Policy</Link>
                <Link to="/cookie-policy">Cookie Policy</Link>
                <Link to="/terms-of-service">Terms of Service</Link>
              </div>
            </LegalSection>

            <LegalSection eyebrow="8" title="Updates">
              <p>
                We may update this Legal Notice when contact routes, service
                operations, or legal requirements change. The latest version will be
                posted on this page with an updated date.
              </p>
            </LegalSection>

            <div className="legal-bottom-nav">
              <Link to="/privacy-policy" className="btn btn-secondary">
                Privacy Policy
              </Link>
              <Link to="/cookie-policy" className="btn btn-secondary">
                Cookie Policy
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
