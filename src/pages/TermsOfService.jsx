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

const summaryCards = [
  {
    title: 'Use the platform responsibly',
    text: 'Do not upload illegal, misleading, harmful, infringing, private, or unauthorized content.',
  },
  {
    title: 'Protect your account',
    text: 'You are responsible for your account activity, login access, published profiles, and QR-connected content.',
  },
  {
    title: 'Public means public',
    text: 'Content published on public QR profiles can be viewed by anyone with the link or QR code.',
  },
]

const acceptableUseRules = [
  'Do not use Dresscode for illegal, deceptive, fraudulent, abusive, or harmful activity.',
  'Do not upload content that infringes copyright, trademarks, privacy rights, image rights, or other third-party rights.',
  'Do not publish private personal data about another person without the right to do so.',
  'Do not attempt to access, activate, modify, scan, scrape, or interfere with QR codes, accounts, profiles, templates, or systems you do not control.',
  'Do not bypass security, rate limits, authentication, activation checks, or ownership controls.',
  'Do not upload malware, malicious links, phishing content, spam, or content designed to compromise another person or system.',
  'Do not misrepresent ownership, affiliation, sponsorship, identity, product authenticity, or campaign authorization.',
]

const userContentRules = [
  {
    title: 'You keep your rights',
    text: 'You keep ownership of content you already own. By adding it to Dresscode, you give us the permission needed to host, display, publish, process, resize, transmit, and make it available through the platform.',
  },
  {
    title: 'You need permission',
    text: 'Only upload images, names, links, brands, product details, stories, and media that you own or are legally allowed to use.',
  },
  {
    title: 'You control public visibility',
    text: 'When you publish a public profile, QR page, campaign page, product story, or similar public content, visitors may view it without signing in.',
  },
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

export default function TermsOfService() {
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
              Terms of Service
            </motion.h1>

            <motion.p
              className="lead legal-hero-lead mb-6"
              variants={fadeUp}
              transition={{ duration: 0.5 }}
            >
              These Terms of Service explain the rules for using Dresscode, including
              accounts, QR-connected profiles, public pages, activation flows, product
              storytelling, scan experiences, and related platform features.
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
            {summaryCards.map((item) => (
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
            <LegalSection eyebrow="1" title="Agreement to these terms">
              <p>
                By accessing or using Dresscode, creating an account, activating a QR
                code, publishing a profile, scanning a public QR experience, or using
                any related feature, you agree to these Terms of Service.
              </p>

              <p>
                If you use Dresscode on behalf of a company, brand, organization,
                client, school, team, or other entity, you confirm that you have
                authority to accept these terms for that entity.
              </p>

              <p>
                If you do not agree with these terms, do not use the platform.
              </p>
            </LegalSection>

            <LegalSection eyebrow="2" title="What Dresscode is">
              <p>
                Dresscode is a wearable media and QR identity platform that connects
                physical garments, products, collectibles, badges, campaigns, or other
                items to public digital profiles and storytelling pages.
              </p>

              <p>
                The platform may include account dashboards, QR code activation,
                profile editing, public pages, scan analytics, template-controlled
                profiles, article or media features, product storytelling, and
                simulated shop or order flows.
              </p>
            </LegalSection>

            <LegalSection eyebrow="3" title="Accounts and access">
              <p>
                You may need an account to access dashboards, activate QR codes, edit
                profiles, manage templates, view analytics, or use protected features.
                You must provide accurate account information and keep your login
                access secure.
              </p>

              <p>You are responsible for:</p>

              <ul>
                <li>Activity that happens through your account.</li>
                <li>Keeping your email address and login details secure.</li>
                <li>Using only QR codes, profiles, templates, or pages you are allowed to control.</li>
                <li>Promptly telling us if you suspect unauthorized access or misuse.</li>
              </ul>

              <p>
                We may restrict, suspend, or remove access if we reasonably believe an
                account is being misused, compromised, or used in violation of these
                terms.
              </p>
            </LegalSection>

            <LegalSection eyebrow="4" title="QR codes, activation, and ownership controls">
              <p>
                Dresscode QR codes may connect physical items to digital pages. Some QR
                codes may be open for activation by an eligible user. Others may be
                assigned to a specific email, buyer, organization, template, campaign,
                or administrator.
              </p>

              <p>
                You must not activate, claim, edit, transfer, or interfere with a QR
                code unless you have the right to do so. Attempting to bypass
                activation checks, email-bound assignment, scratch-code validation, or
                template ownership controls is prohibited.
              </p>

              <p>
                Dresscode may use verification, assignment, and security checks to help
                protect QR ownership and prevent unauthorized activation.
              </p>
            </LegalSection>

            <LegalSection eyebrow="5" title="Public profiles and published content">
              <p>
                Dresscode allows users to publish public profiles, product stories,
                campaign pages, QR-linked pages, media blocks, links, images, and other
                content. Public content can be viewed by visitors who scan the QR code
                or open the public link.
              </p>

              <div className="legal-card-list">
                {userContentRules.map((rule) => (
                  <article key={rule.title} className="legal-info-card">
                    <h3>{rule.title}</h3>
                    <p>{rule.text}</p>
                  </article>
                ))}
              </div>

              <p>
                We may remove, hide, restrict, or disable content if we reasonably
                believe it violates these terms, infringes rights, creates legal risk,
                harms users, compromises platform security, or misrepresents a person,
                brand, product, or organization.
              </p>
            </LegalSection>

            <LegalSection eyebrow="6" title="Acceptable use">
              <p>
                You must use Dresscode lawfully and responsibly. The following actions
                are not allowed:
              </p>

              <ul>
                {acceptableUseRules.map((rule) => (
                  <li key={rule}>{rule}</li>
                ))}
              </ul>
            </LegalSection>

            <LegalSection eyebrow="7" title="Shop, product, and simulated order features">
              <p>
                Dresscode may include product pages, simulated shop flows, sample order
                flows, buyer-bound QR generation, or collectible/product storytelling
                features. Unless a page clearly states that a real payment, sale,
                shipment, or commercial order is being completed, simulated shop flows
                are for product experience, testing, demonstration, or platform
                interaction purposes only.
              </p>

              <p>
                You are responsible for ensuring that any real product sale, promotion,
                campaign, delivery, warranty, return policy, consumer notice, or
                commercial claim connected to your use of Dresscode complies with
                applicable law.
              </p>
            </LegalSection>

            <LegalSection eyebrow="8" title="Intellectual property">
              <p>
                Dresscode, including its platform design, interface, software, brand
                elements, product structure, and original platform materials, is owned
                by Dresscode or its licensors. These terms do not transfer ownership of
                the platform to you.
              </p>

              <p>
                You may not copy, reverse engineer, resell, misuse, or exploit the
                platform except as allowed by these terms or by written permission.
              </p>

              <p>
                Your uploaded content remains yours or belongs to the rights holder.
                You grant Dresscode the limited permission needed to operate,
                display, host, process, transmit, and improve the service in connection
                with your use of the platform.
              </p>
            </LegalSection>

            <LegalSection eyebrow="9" title="Third-party services and links">
              <p>
                Dresscode may include links to third-party websites, social profiles,
                embedded content, service providers, or external tools. We are not
                responsible for third-party services, websites, content, policies, or
                practices.
              </p>

              <p>
                Users are responsible for the links they add to public profiles and for
                ensuring those links are lawful, safe, accurate, and authorized.
              </p>
            </LegalSection>

            <LegalSection eyebrow="10" title="Privacy">
              <p>
                Our <Link to="/privacy-policy">Privacy Policy</Link> explains how
                Dresscode collects, uses, stores, and protects personal data. Our{' '}
                <Link to="/cookie-policy">Cookie Policy</Link> explains how cookies,
                local storage, and similar technologies are used.
              </p>

              <p>
                By using the platform, you acknowledge that we process data as
                described in those policies.
              </p>
            </LegalSection>

            <LegalSection eyebrow="11" title="Service availability and changes">
              <p>
                We aim to keep Dresscode available and reliable, but we do not
                guarantee that the platform will always be uninterrupted, error-free,
                secure, or available at a specific time.
              </p>

              <p>
                We may update, modify, suspend, replace, limit, or discontinue features
                where needed for maintenance, security, legal compliance, product
                development, or business reasons.
              </p>
            </LegalSection>

            <LegalSection eyebrow="12" title="Disclaimers">
              <p>
                Dresscode is provided on an “as is” and “as available” basis to the
                maximum extent permitted by law. We do not promise that the platform
                will meet every requirement, produce specific commercial results,
                prevent every unauthorized use, or be free from every defect.
              </p>

              <p>
                Scan analytics, public engagement indicators, QR activity, profile
                performance, and similar signals are informational and may be
                approximate. They should not be treated as guaranteed measurements,
                legal records, or financial reports.
              </p>
            </LegalSection>

            <LegalSection eyebrow="13" title="Limitation of liability">
              <p>
                To the maximum extent permitted by law, Dresscode will not be liable
                for indirect, incidental, special, consequential, exemplary, or punitive
                damages, or for lost profits, lost revenue, lost data, reputational
                harm, business interruption, or unauthorized use of content.
              </p>

              <p>
                Nothing in these terms excludes or limits liability that cannot be
                excluded or limited under applicable law, including mandatory consumer
                rights where they apply.
              </p>
            </LegalSection>

            <LegalSection eyebrow="14" title="Your responsibility to us">
              <p>
                If your content, account activity, QR usage, product claims, campaign,
                links, or misuse of Dresscode causes claims, losses, damages, fines,
                costs, or legal expenses, you are responsible for those consequences to
                the extent permitted by law.
              </p>
            </LegalSection>

            <LegalSection eyebrow="15" title="Suspension and termination">
              <p>
                You may stop using Dresscode at any time. We may suspend, restrict, or
                terminate access if we reasonably believe that you violated these
                terms, created legal risk, harmed other users, compromised security, or
                misused the platform.
              </p>

              <p>
                After termination, public content may be removed or made unavailable,
                subject to backup, legal, security, and legitimate business retention
                needs described in the Privacy Policy.
              </p>
            </LegalSection>

            <LegalSection eyebrow="16" title="Governing law and disputes">
              <p>
                These terms are governed by the laws applicable to the legal operator
                of Dresscode, unless mandatory consumer protection laws require a
                different rule. Courts or authorities with mandatory jurisdiction under
                applicable law may still apply.
              </p>

              <p>
                Before starting a formal dispute, please contact us first so we can try
                to resolve the issue directly.
              </p>
            </LegalSection>

            <LegalSection eyebrow="17" title="Changes to these terms">
              <p>
                We may update these Terms of Service as the platform, legal
                requirements, or business operations change. The updated version will
                be posted on this page with a new “Last updated” date.
              </p>

              <p>
                Continued use of Dresscode after updated terms become effective means
                you accept the updated terms.
              </p>
            </LegalSection>

            <LegalSection eyebrow="18" title="Contact">
              <p>
                For questions about these terms, contact{' '}
                <a href="mailto:hello@dresscode.bio">hello@dresscode.bio</a>.
              </p>

              <p>
                You can also visit the <Link to="/legal-notice">Legal Notice</Link> for
                platform operator and contact information.
              </p>
            </LegalSection>

            <div className="legal-bottom-nav">
              <Link to="/privacy-policy" className="btn btn-secondary">
                Privacy Policy
              </Link>
              <Link to="/cookie-policy" className="btn btn-secondary">
                Cookie Policy
              </Link>
              <Link to="/legal-notice" className="btn btn-primary glow-btn">
                Legal Notice
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
