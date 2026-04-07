import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

import heroMain from '../assets/home/hero-main.jpg'
import heroCard1 from '../assets/home/hero-card-1.jpg'
import heroCard2 from '../assets/home/hero-card-2.jpg'
import usecaseAthlete from '../assets/home/usecase-athlete.jpg'
import usecaseBrand from '../assets/home/usecase-brand.jpg'
import usecaseEvent from '../assets/home/usecase-event.jpg'
import ctaBanner from '../assets/home/cta-banner.jpg'

import heroGarmentTag from '../assets/home/hero-garment-tag.jpg'
import wearableStepScan from '../assets/home/wearable-step-scan.jpg'
import wearableStepActivation from '../assets/home/wearable-step-activation.jpg'
import wearableStepLivePage from '../assets/home/wearable-step-live-page.jpg'
import usecaseFashionTag from '../assets/home/usecase-fashion-tag.jpg'
import usecaseMerchDrop from '../assets/home/usecase-merch-drop.jpg'
import ctaWearableBanner from '../assets/home/cta-wearable-banner.jpg'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const heroStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.05,
    },
  },
}

const features = [
  {
    title: 'Unique QR identity',
    text: 'Every garment or object gets its own public code and private scratch activation flow.',
  },
  {
    title: 'Dynamic live profiles',
    text: 'Profiles can evolve over time with links, media, sections, and custom page experiences.',
  },
  {
    title: 'Ownership + control',
    text: 'Users activate and manage their own codes, while brands can issue locked official content.',
  },
]

const storyMoments = [
  {
    title: 'A garment becomes the entry point',
    text: 'The experience no longer starts on a website. It starts on the product itself — on the tag, the label, the uniform, the piece of merchandise someone is already holding.',
    image: heroGarmentTag,
  },
  {
    title: 'A scan opens the second layer',
    text: 'One scan turns fabric into media. What looked physical a moment ago becomes interactive, personal, branded, and live.',
    image: wearableStepScan,
  },
  {
    title: 'Activation creates ownership',
    text: 'With a scratch code and account flow, the product is not only seen — it is claimed. That is where utility becomes identity.',
    image: wearableStepActivation,
  },
]

const steps = [
  {
    no: '01',
    title: 'Scan',
    text: 'A visitor scans the QR code embedded into the product or garment.',
    image: heroCard1,
  },
  {
    no: '02',
    title: 'Activate',
    text: 'The owner claims the item using the scratch code and account verification flow.',
    image: wearableStepActivation,
  },
  {
    no: '03',
    title: 'Build',
    text: 'The user customizes the public page with media, links, and profile content.',
    image: heroCard2,
  },
  {
    no: '04',
    title: 'Share',
    text: 'Future scans open the live experience instantly with analytics and content control.',
    image: wearableStepLivePage,
  },
]

const useCases = [
  {
    title: 'Athletes and teams',
    text: 'Turn performance wear into a living identity with social links, updates, and official content.',
    image: usecaseAthlete,
  },
  {
    title: 'Fashion and branded apparel',
    text: 'Transform garments into connected storytelling surfaces with identity, activation, and digital presence.',
    image: usecaseFashionTag,
  },
  {
    title: 'Brands and drops',
    text: 'Connect products to launch pages, authentication, campaign media, and collectible storytelling.',
    image: usecaseBrand,
  },
  {
    title: 'Merchandise and collectible releases',
    text: 'Make limited pieces feel alive through linked media, ownership journeys, and post-purchase engagement.',
    image: usecaseMerchDrop,
  },
  {
    title: 'Events and staff',
    text: 'Give uniforms, badges, and event items a digital layer for profile access and live information.',
    image: usecaseEvent,
  },
]

const platformSignals = [
  'Wearable media for garments and merchandise',
  'QR + scratch activation tied to ownership',
  'Editable live identity pages for open codes',
  'Locked official content for brands and organizations',
  'Scan analytics and role-based management',
  'A digital layer that starts from the real-world product',
]

function GlitterField({ count = 18 }) {
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

function SectionIntro({ eyebrow, title, text, tight = false }) {
  return (
    <motion.div
      className={`max-w-3xl ${tight ? 'mb-10' : 'mb-12'}`}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <div className="eyebrow mb-4">{eyebrow}</div>
      <h2 className="section-title mb-4">{title}</h2>
      <p className="lead">{text}</p>
    </motion.div>
  )
}

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <div className="app-shell home-hightech">
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <GlitterField count={20} />

      <section className="section relative overflow-hidden">
        <div className="hero-orb orb-1" />
        <div className="hero-orb orb-2" />
        <div className="hero-ring hero-ring-1" />
        <div className="hero-ring hero-ring-2" />

        <div className="container">
          <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
            <motion.div
              className="hero-copy"
              variants={heroStagger}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
                <div className="eyebrow mb-6">Wearable media infrastructure</div>
              </motion.div>

              <motion.h1
                className="hero-title mb-6"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                Turn every garment into a
                <span className="text-[#5ECFCF] hero-accent"> living digital identity</span>
              </motion.h1>

              <motion.p
                className="lead mb-8 max-w-2xl"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                Dresscode connects physical products to dynamic profile pages, secure
                activation, analytics, and branded digital experiences. It is built for
                wearable media — where the story starts on the item itself.
              </motion.p>

              <motion.div
                className="flex flex-col gap-3 sm:flex-row"
                variants={fadeUp}
                transition={{ duration: 0.45 }}
              >
                {!loading && !user ? (
                  <>
                    <Link to="/portal" className="btn btn-primary glow-btn">
                      Get Started
                    </Link>
                    <Link to="/how-it-works" className="btn btn-secondary">
                      Explore Platform
                    </Link>
                  </>
                ) : null}

                {!loading && user ? (
                  <>
                    <Link to="/dashboard" className="btn btn-primary glow-btn">
                      Open Dashboard
                    </Link>
                    <Link to="/how-it-works" className="btn btn-secondary">
                      Platform Overview
                    </Link>
                  </>
                ) : null}
              </motion.div>

              <motion.div
                className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                <div className="glass-card p-5">
                  <div className="metric-value">QR + Scratch</div>
                  <div className="metric-label">Secure activation model</div>
                </div>
                <div className="glass-card p-5">
                  <div className="metric-value">Live Pages</div>
                  <div className="metric-label">Dynamic public experiences</div>
                </div>
                <div className="glass-card p-5">
                  <div className="metric-value">Admin Control</div>
                  <div className="metric-label">Roles, templates, analytics</div>
                </div>
              </motion.div>
            </motion.div>

            <motion.div
              className="hero-visual"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.55, delay: 0.12 }}
            >
              <div className="grid gap-4">
                <div className="surface-card overflow-hidden p-3 md:p-4">
                  <div className="group relative overflow-hidden rounded-[24px] media-frame">
                    <img
                      src={heroMain}
                      alt="Dresscode wearable identity hero"
                      className="h-[420px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/90 via-[#071515]/20 to-transparent" />
                    <div className="absolute inset-0 hero-image-shine" />
                    <div className="absolute bottom-0 left-0 right-0 p-6">
                      <div className="mb-2 text-sm uppercase tracking-[0.18em] text-[#5ECFCF]">
                        Live identity layer
                      </div>
                      <div className="text-2xl font-bold">
                        Physical product, digital presence
                      </div>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="glass-card overflow-hidden p-3">
                    <div className="group relative overflow-hidden rounded-[22px] media-frame">
                      <img
                        src={heroGarmentTag}
                        alt="Garment tag with QR identity"
                        className="h-[220px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 hero-image-shine" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="font-semibold">Start from the garment</div>
                        <div className="text-sm text-white/70">
                          The wearable item becomes the first screen
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card overflow-hidden p-3">
                    <div className="group relative overflow-hidden rounded-[22px] media-frame">
                      <img
                        src={heroCard2}
                        alt="Phone showing public profile"
                        className="h-[220px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/80 via-transparent to-transparent" />
                      <div className="absolute inset-0 hero-image-shine" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="font-semibold">Open the live page</div>
                        <div className="text-sm text-white/70">
                          Media, identity, links, and official content
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <SectionIntro
            tight
            eyebrow="Story first"
            title="The product is no longer the end of the journey — it is the beginning"
            text="A shirt, a jersey, a badge, a drop, a collectible piece. What used to stop at the physical object can now continue into identity, ownership, updates, and branded storytelling."
          />

          <div className="grid gap-6 lg:grid-cols-3">
            {storyMoments.map((item, index) => (
              <motion.div
                key={item.title}
                className="surface-card overflow-hidden p-3"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.42, delay: index * 0.06 }}
              >
                <div className="group overflow-hidden rounded-[24px] media-frame">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-[250px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>

                <div className="p-4">
                  <h3 className="display mb-3 text-2xl font-bold">{item.title}</h3>
                  <p className="text-sm leading-7 text-white/65">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <SectionIntro
            tight
            eyebrow="Core platform"
            title="Built for identity, ownership, and live branded experiences"
            text="Dresscode is not only a QR generator. It is a system for activation, official content, personalization, and scan-driven engagement."
          />

          <div className="grid-3">
            {features.map((item, index) => (
              <motion.div
                key={item.title}
                className="surface-card group p-6"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.42, delay: index * 0.06 }}
              >
                <div className="feature-icon mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl text-[#5ECFCF]">
                  0{index + 1}
                </div>
                <h3 className="display mb-3 text-2xl font-bold">{item.title}</h3>
                <p className="text-sm leading-7 text-white/65">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {platformSignals.map((item, index) => (
              <motion.div
                key={item}
                className="surface-card p-5"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.38, delay: index * 0.04 }}
              >
                <div className="text-base leading-7 text-white/72">{item}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <SectionIntro
            eyebrow="How it works"
            title="A simple flow with real control behind it"
            text="From scan to activation to editing, Dresscode makes a physical item behave like a live digital identity."
          />

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step, index) => (
              <motion.div
                key={step.no}
                className="surface-card group overflow-hidden p-3"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.42, delay: index * 0.05 }}
              >
                <div className="overflow-hidden rounded-[20px] media-frame">
                  <img
                    src={step.image}
                    alt={step.title}
                    className="h-[190px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>

                <div className="p-3">
                  <div className="display mb-4 text-4xl font-bold text-[#5ECFCF] step-number">
                    {step.no}
                  </div>
                  <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                  <p className="text-sm leading-7 text-white/62">{step.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <SectionIntro
            tight
            eyebrow="Use cases"
            title="Fashion-tech infrastructure for multiple worlds"
            text="Built for creators, athletes, brands, events, merchandise systems, and collectible ecosystems."
          />

          <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
            {useCases.map((item, index) => (
              <motion.div
                key={item.title}
                className="surface-card overflow-hidden p-3"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.42, delay: index * 0.06 }}
              >
                <div className="group overflow-hidden rounded-[24px] media-frame">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-[260px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                </div>

                <div className="p-4">
                  <h3 className="display mb-3 text-2xl font-bold">{item.title}</h3>
                  <p className="text-sm leading-7 text-white/65">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
            <motion.div
              className="grid gap-4"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45 }}
            >
              <div className="glass-card overflow-hidden p-3">
                <div className="group relative overflow-hidden rounded-[26px] media-frame">
                  <img
                    src={ctaWearableBanner}
                    alt="Dresscode wearable merchandise call to action"
                    className="h-[260px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/85 via-[#071515]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="mb-2 text-sm uppercase tracking-[0.18em] text-[#5ECFCF]">
                      Wearable future
                    </div>
                    <div className="text-2xl font-bold">
                      Merchandise with a second life
                    </div>
                  </div>
                </div>
              </div>

              <div className="glass-card overflow-hidden p-3">
                <div className="group relative overflow-hidden rounded-[26px] media-frame">
                  <img
                    src={ctaBanner}
                    alt="Dresscode call to action"
                    className="h-[140px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/85 via-[#071515]/20 to-transparent" />
                </div>
              </div>
            </motion.div>

            <motion.div
              className="surface-card p-8 md:p-10"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45 }}
            >
              <div className="eyebrow mb-5">Start now</div>
              <h2 className="section-title mb-4">
                Activate products, publish profiles, and manage official content
              </h2>
              <p className="lead mb-8">
                Your foundation is already working. The next step is turning it into a
                polished public platform that makes wearable media instantly understandable.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-5 hightech-panel">
                  <div className="mb-2 text-lg font-semibold">For users</div>
                  <div className="text-sm leading-7 text-white/62">
                    Activate, edit, publish, and share personal pages tied to physical products.
                  </div>
                </div>

                <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-5 hightech-panel">
                  <div className="mb-2 text-lg font-semibold">For brands</div>
                  <div className="text-sm leading-7 text-white/62">
                    Create locked official experiences, track scans, and control public storytelling.
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 md:flex-row">
                {!loading && !user ? (
                  <>
                    <Link to="/portal" className="btn btn-primary glow-btn">
                      Open Portal
                    </Link>
                    <Link to="/contact" className="btn btn-secondary">
                      Contact Team
                    </Link>
                  </>
                ) : null}

                {!loading && user ? (
                  <>
                    <Link to="/dashboard" className="btn btn-primary glow-btn">
                      Continue to Dashboard
                    </Link>
                    <Link to="/journal" className="btn btn-secondary">
                      Open Journal
                    </Link>
                  </>
                ) : null}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}