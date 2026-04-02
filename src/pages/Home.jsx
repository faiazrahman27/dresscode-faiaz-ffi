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

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  visible: { opacity: 1, y: 0 },
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

const steps = [
  {
    no: '01',
    title: 'Scan',
    text: 'A visitor scans the QR code embedded into the product or garment.',
  },
  {
    no: '02',
    title: 'Activate',
    text: 'The owner claims the item using the scratch code and account verification flow.',
  },
  {
    no: '03',
    title: 'Build',
    text: 'The user customizes the public page with media, links, and profile content.',
  },
  {
    no: '04',
    title: 'Share',
    text: 'Future scans open the live experience instantly with analytics and content control.',
  },
]

const useCases = [
  {
    title: 'Athletes and teams',
    text: 'Turn performance wear into a living identity with social links, updates, and official content.',
    image: usecaseAthlete,
  },
  {
    title: 'Brands and drops',
    text: 'Connect products to launch pages, authentication, campaign media, and collectible storytelling.',
    image: usecaseBrand,
  },
  {
    title: 'Events and staff',
    text: 'Give uniforms, badges, and event items a digital layer for profile access and live information.',
    image: usecaseEvent,
  },
]

export default function Home() {
  const { user, loading } = useAuth()

  return (
    <div className="app-shell">
      <section className="section relative overflow-hidden">
        <div className="hero-orb orb-1" />
        <div className="hero-orb orb-2" />

        <div className="container">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.6 }}
            >
              <div className="eyebrow mb-6">Wearable media infrastructure</div>

              <h1 className="hero-title mb-6">
                Turn every garment into a
                <span className="text-[#5ECFCF]"> living digital identity</span>
              </h1>

              <p className="lead mb-8 max-w-2xl">
                Dresscode connects physical products to dynamic profile pages,
                secure activation, analytics, and branded digital experiences.
              </p>

              <div className="flex flex-col gap-3 sm:flex-row">
                {!loading && !user ? (
                  <>
                    <Link to="/portal" className="btn btn-primary">
                      Get Started
                    </Link>
                    <Link to="/how-it-works" className="btn btn-secondary">
                      Explore Platform
                    </Link>
                  </>
                ) : null}

                {!loading && user ? (
                  <>
                    <Link to="/dashboard" className="btn btn-primary">
                      Open Dashboard
                    </Link>
                    <Link to="/how-it-works" className="btn btn-secondary">
                      Platform Overview
                    </Link>
                  </>
                ) : null}
              </div>

              <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.7, delay: 0.12 }}
            >
              <div className="grid gap-4">
                <div className="surface-card overflow-hidden p-3 md:p-4">
                  <div className="group relative overflow-hidden rounded-[24px]">
                    <img
                      src={heroMain}
                      alt="Dresscode wearable identity hero"
                      className="h-[420px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/90 via-[#071515]/20 to-transparent" />
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
                    <div className="group relative overflow-hidden rounded-[22px]">
                      <img
                        src={heroCard1}
                        alt="QR scan on fashion item"
                        className="h-[220px] w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="font-semibold">Scan the product</div>
                        <div className="text-sm text-white/70">
                          Start from the garment itself
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="glass-card overflow-hidden p-3">
                    <div className="group relative overflow-hidden rounded-[22px]">
                      <img
                        src={heroCard2}
                        alt="Phone showing public profile"
                        className="h-[220px] w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/80 via-transparent to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <div className="font-semibold">Open the live page</div>
                        <div className="text-sm text-white/70">
                          Socials, media, official content
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
          <div className="mb-10 max-w-3xl">
            <div className="eyebrow mb-4">Core platform</div>
            <h2 className="section-title mb-4">
              Built for identity, ownership, and live branded experiences
            </h2>
            <p className="lead">
              Dresscode is not only a QR generator. It is a system for activation,
              official content, personalization, and scan-driven engagement.
            </p>
          </div>

          <div className="grid-3">
            {features.map((item, index) => (
              <motion.div
                key={item.title}
                className="surface-card group p-6 transition duration-300 hover:translate-y-[-4px]"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <div className="mb-4 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-[rgba(94,207,207,0.08)] text-[#5ECFCF]">
                  0{index + 1}
                </div>
                <h3 className="display mb-3 text-2xl font-bold">{item.title}</h3>
                <p className="text-sm leading-7 text-white/65">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container">
          <div className="mb-12 max-w-3xl">
            <div className="eyebrow mb-5">How it works</div>
            <h2 className="section-title mb-4">
              A simple flow with real control behind it
            </h2>
            <p className="lead">
              From scan to activation to editing, Dresscode makes a physical item behave like a live digital identity.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {steps.map((step) => (
              <div key={step.no} className="surface-card group p-6 transition duration-300 hover:translate-y-[-4px]">
                <div className="display mb-5 text-4xl font-bold text-[#5ECFCF]">{step.no}</div>
                <h3 className="mb-3 text-xl font-semibold">{step.title}</h3>
                <p className="text-sm leading-7 text-white/62">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="section-tight">
        <div className="container">
          <div className="mb-10 max-w-3xl">
            <div className="eyebrow mb-4">Use cases</div>
            <h2 className="section-title mb-4">
              Fashion-tech infrastructure for multiple worlds
            </h2>
            <p className="lead">
              Built for creators, athletes, brands, events, and collectible ecosystems.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {useCases.map((item, index) => (
              <motion.div
                key={item.title}
                className="surface-card overflow-hidden p-3"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.25 }}
                transition={{ duration: 0.45, delay: index * 0.08 }}
              >
                <div className="group overflow-hidden rounded-[24px]">
                  <img
                    src={item.image}
                    alt={item.title}
                    className="h-[260px] w-full object-cover transition duration-500 group-hover:scale-[1.05]"
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
            <div className="glass-card overflow-hidden p-3">
              <div className="group relative overflow-hidden rounded-[26px]">
                <img
                  src={ctaBanner}
                  alt="Dresscode call to action"
                  className="h-[420px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/85 via-[#071515]/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="mb-2 text-sm uppercase tracking-[0.18em] text-[#5ECFCF]">
                    Ready to build
                  </div>
                  <div className="text-2xl font-bold">
                    Launch a live QR identity experience
                  </div>
                </div>
              </div>
            </div>

            <div className="surface-card p-8 md:p-10">
              <div className="eyebrow mb-5">Start now</div>
              <h2 className="section-title mb-4">
                Activate products, publish profiles, and manage official content
              </h2>
              <p className="lead mb-8">
                Your foundation is already working. The next step is turning it into a polished public platform.
              </p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-5">
                  <div className="mb-2 text-lg font-semibold">For users</div>
                  <div className="text-sm leading-7 text-white/62">
                    Activate, edit, publish, and share personal pages tied to physical products.
                  </div>
                </div>

                <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-5">
                  <div className="mb-2 text-lg font-semibold">For brands</div>
                  <div className="text-sm leading-7 text-white/62">
                    Create locked official experiences, track scans, and control public storytelling.
                  </div>
                </div>
              </div>

              <div className="mt-8 flex flex-col gap-4 md:flex-row">
                {!loading && !user ? (
                  <>
                    <Link to="/portal" className="btn btn-primary">
                      Open Portal
                    </Link>
                    <Link to="/contact" className="btn btn-secondary">
                      Contact Team
                    </Link>
                  </>
                ) : null}

                {!loading && user ? (
                  <>
                    <Link to="/dashboard" className="btn btn-primary">
                      Continue to Dashboard
                    </Link>
                    <Link to="/journal" className="btn btn-secondary">
                      Open Journal
                    </Link>
                  </>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
