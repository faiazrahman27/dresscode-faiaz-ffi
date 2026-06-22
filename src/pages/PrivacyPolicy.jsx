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

const quickSummary = [
  {
    title: 'What we collect',
    text: 'Account details, profile content, QR activation details, scan-related usage data, contact messages, and order or product information where relevant.',
  },
  {
    title: 'Why we use it',
    text: 'To run the platform, secure accounts, activate QR experiences, publish public profiles, respond to inquiries, and improve the service.',
  },
  {
    title: 'Your choices',
    text: 'You can manage your account content, request access or deletion, and control optional cookies or local storage choices.',
  },
]

const dataCategories = [
  {
    title: 'Account information',
    items: [
      'Name, email address, login details, account role, and authentication status.',
      'Information needed to create, secure, and manage your account.',
    ],
  },
  {
    title: 'Profile and page content',
    items: [
      'Public profile details, images, links, text, social links, media blocks, and page-builder content you choose to publish.',
      'Content connected to QR codes, garments, products, collectibles, campaigns, or public identity pages.',
    ],
  },
  {
    title: 'QR activation and ownership information',
    items: [
      'QR code references, activation status, scratch-code validation results, assigned email checks, template associations, and ownership-related platform actions.',
      'Information needed to prevent unauthorized activation and preserve the intended control of a code or profile.',
    ],
  },
  {
    title: 'Scan and usage data',
    items: [
      'Approximate scan events, timestamps, page interactions, device or browser signals, and general location signals where available.',
      'This is used to provide scan analytics, detect abuse, understand performance, and improve the product experience.',
    ],
  },
  {
    title: 'Contact and support information',
    items: [
      'Name, email address, company or project name, inquiry type, and message content submitted through contact forms or support channels.',
      'We use this information to respond to your request and keep a reasonable record of the conversation.',
    ],
  },
  {
    title: 'Shop, product, and simulated order information',
    items: [
      'Product details, buyer email, generated QR code references, order status, and information needed to connect a purchased or assigned item to a digital profile.',
      'Where a shop flow is described as simulated, it should not be treated as a completed real-world payment or delivery service unless clearly stated otherwise.',
    ],
  },
]

const lawfulBases = [
  {
    basis: 'Contract',
    use: 'Creating accounts, providing dashboard access, activating QR codes, publishing profiles, and delivering requested platform features.',
  },
  {
    basis: 'Legitimate interests',
    use: 'Securing the service, preventing abuse, understanding platform performance, responding to business inquiries, and improving Dresscode.',
  },
  {
    basis: 'Consent',
    use: 'Optional cookies, optional analytics or marketing storage, and any optional communications that legally require consent.',
  },
  {
    basis: 'Legal obligation',
    use: 'Keeping records where required by law, responding to lawful requests, and complying with applicable legal duties.',
  },
]

const rights = [
  'Request access to personal data we hold about you.',
  'Ask us to correct incomplete or inaccurate data.',
  'Ask us to delete personal data where the law allows deletion.',
  'Object to or restrict certain processing.',
  'Withdraw consent where processing is based on consent.',
  'Request a portable copy of data where applicable.',
  'Complain to a competent data protection authority.',
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

export default function PrivacyPolicy() {
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
              Privacy Policy
            </motion.h1>

            <motion.p
              className="lead legal-hero-lead mb-6"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              This Privacy Policy explains how Dresscode collects, uses, stores, and
              protects personal data when people use the platform, create accounts,
              activate QR codes, publish profile pages, contact us, or interact with
              public QR experiences.
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
            className="legal-summary-grid mt-10"
            variants={heroStagger}
            initial="hidden"
            animate="visible"
          >
            {quickSummary.map((item) => (
              <motion.article
                key={item.title}
                className="surface-card legal-summary-card"
                variants={fadeUp}
                transition={{ duration: 0.45 }}
              >
                <h2 className="display">{item.title}</h2>
                <p>{item.text}</p>
              </motion.article>
            ))}
          </motion.div>
        </div>
      </section>

      <section className="px-4 pb-16 md:pb-24">
        <div className="container max-w-5xl">
          <div className="legal-content-stack">
            <LegalSection eyebrow="1" title="Who is responsible for your data">
              <p>
                Dresscode is responsible for the personal data processed through the
                platform. References to “Dresscode,” “we,” “us,” or “our” mean the
                operator of the Dresscode wearable media platform.
              </p>

              <p>
                For privacy questions, data requests, or legal notices, contact us at{' '}
                <a href="mailto:hello@dresscode.bio">hello@dresscode.bio</a>.
              </p>

              <p>
                If a different legal operator, business address, or dedicated privacy
                contact is required for your deployment, those details should be added
                before public launch.
              </p>
            </LegalSection>

            <LegalSection eyebrow="2" title="Personal data we collect">
              <p>
                We collect only the information needed to operate Dresscode, protect
                accounts and QR experiences, respond to requests, and support public
                profile functionality.
              </p>

              <div className="legal-card-list">
                {dataCategories.map((category) => (
                  <article key={category.title} className="legal-info-card">
                    <h3>{category.title}</h3>
                    <ul>
                      {category.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </LegalSection>

            <LegalSection eyebrow="3" title="How we use personal data">
              <p>We use personal data for the following purposes:</p>

              <ul>
                <li>To create, authenticate, and manage user accounts.</li>
                <li>To provide dashboards, profile editing, QR activation, and public profile pages.</li>
                <li>To connect QR codes with the correct owner, buyer, assignee, or template.</li>
                <li>To publish public content that users intentionally make visible.</li>
                <li>To provide scan analytics and understand how QR experiences are used.</li>
                <li>To respond to contact, support, business, or partnership inquiries.</li>
                <li>To prevent unauthorized access, abuse, fraud, spam, and platform misuse.</li>
                <li>To maintain, troubleshoot, and improve the platform.</li>
                <li>To comply with legal obligations and enforce our Terms of Service.</li>
              </ul>
            </LegalSection>

            <LegalSection eyebrow="4" title="Legal bases for processing">
              <p>
                Where the General Data Protection Regulation or similar privacy laws
                apply, we rely on the legal bases below depending on the context.
              </p>

              <div className="legal-table-wrap">
                <table className="legal-table">
                  <thead>
                    <tr>
                      <th>Legal basis</th>
                      <th>Typical use</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lawfulBases.map((item) => (
                      <tr key={item.basis}>
                        <td>{item.basis}</td>
                        <td>{item.use}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </LegalSection>

            <LegalSection eyebrow="5" title="Public profiles and user content">
              <p>
                Dresscode allows users and organizations to create public digital
                profiles connected to QR codes, garments, products, collectibles,
                badges, campaigns, or other physical items. Information added to a
                public profile may be visible to anyone who scans the QR code or visits
                the public link.
              </p>

              <p>
                Do not publish private, confidential, illegal, misleading, harmful, or
                third-party content unless you have the right to do so. Users are
                responsible for the profile content, links, images, and media they
                choose to publish.
              </p>
            </LegalSection>

            <LegalSection eyebrow="6" title="Cookies, local storage, and similar technologies">
              <p>
                Dresscode uses strictly necessary browser storage for core functions
                such as authentication, account access, navigation, security, and
                saving cookie preferences. Optional analytics or marketing storage is
                not required to use the core platform.
              </p>

              <p>
                You can read more in our <Link to="/cookie-policy">Cookie Policy</Link>.
                Where optional cookies or similar technologies require consent, they
                should remain inactive unless accepted.
              </p>
            </LegalSection>

            <LegalSection eyebrow="7" title="Service providers and recipients">
              <p>
                We may use trusted service providers to host the platform, manage
                authentication, store content, send emails, process contact forms,
                protect the service, and operate product features. These providers
                process data only as needed to deliver their services to Dresscode.
              </p>

              <p>
                We do not sell personal data. We may disclose information if required
                by law, to protect rights and safety, to investigate misuse, or in
                connection with a business transfer such as a merger, acquisition, or
                restructuring.
              </p>
            </LegalSection>

            <LegalSection eyebrow="8" title="International transfers">
              <p>
                The services used to operate Dresscode may process data in countries
                outside your country of residence. Where privacy law requires transfer
                safeguards, we aim to use appropriate protections such as contractual
                safeguards or equivalent lawful transfer mechanisms.
              </p>
            </LegalSection>

            <LegalSection eyebrow="9" title="How long we keep data">
              <p>
                We keep personal data only for as long as reasonably necessary for the
                purpose it was collected, including to provide the platform, maintain
                account records, preserve security logs, resolve disputes, enforce
                terms, comply with legal obligations, and maintain legitimate business
                records.
              </p>

              <p>
                Public profile content generally remains available until it is edited,
                unpublished, deleted, or the related account or QR experience is
                removed, subject to backup, legal, and security retention needs.
              </p>
            </LegalSection>

            <LegalSection eyebrow="10" title="Security">
              <p>
                We use technical and organizational safeguards designed to protect
                personal data against unauthorized access, misuse, loss, alteration,
                and disclosure. No online service can guarantee absolute security, but
                we work to keep the platform protected and limit access to personal
                data to appropriate purposes.
              </p>

              <p>
                This policy intentionally avoids publishing sensitive internal security
                details that could weaken platform protection.
              </p>
            </LegalSection>

            <LegalSection eyebrow="11" title="Your rights">
              <p>
                Depending on where you live, you may have privacy rights over your
                personal data. These may include the right to:
              </p>

              <ul>
                {rights.map((right) => (
                  <li key={right}>{right}</li>
                ))}
              </ul>

              <p>
                To make a request, contact <a href="mailto:hello@dresscode.bio">hello@dresscode.bio</a>.
                We may need to verify your identity before completing a request.
              </p>
            </LegalSection>

            <LegalSection eyebrow="12" title="Children">
              <p>
                Dresscode is not intended for children under the age required to use
                online services in their country. If we learn that a child has provided
                personal data without appropriate permission, we will take reasonable
                steps to delete it.
              </p>
            </LegalSection>

            <LegalSection eyebrow="13" title="Changes to this policy">
              <p>
                We may update this Privacy Policy as the platform, legal requirements,
                or operational practices change. The updated version will be posted on
                this page with a new “Last updated” date. Material changes may be
                communicated through the platform or another appropriate channel.
              </p>
            </LegalSection>

            <div className="legal-bottom-nav">
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
