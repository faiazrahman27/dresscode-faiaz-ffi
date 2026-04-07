import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import heroImage from '../assets/home/usecase-hero.jpg'
import usecaseAthlete from '../assets/home/usecase-athlete.jpg'
import usecaseBrand from '../assets/home/usecase-brand.jpg'
import usecaseEvent from '../assets/home/usecase-event.jpg'
import usecaseCorporate from '../assets/home/usecase-corporate.jpg'
import usecaseHospitality from '../assets/home/usecase-hospitality.jpg'
import usecaseAuth from '../assets/home/usecase-authentication.jpg'
import usecaseCollectible from '../assets/home/usecase-collectible.jpg'
import usecaseCampus from '../assets/home/usecase-campus.jpg'

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

const stripItems = [
  'Athletes & Teams',
  'Brands & Fashion',
  'Corporate Identity',
  'Hospitality',
  'Events & Conferences',
  'Authentication',
  'Collectibles',
  'Campus & Education',
]

const featuredCases = [
  {
    title: 'Athletes & Teams',
    text: 'Jerseys, training wear, and team merchandise can become living identity layers with stats, links, media, announcements, and official partner experiences.',
    image: usecaseAthlete,
    reverse: false,
  },
  {
    title: 'Brands & Fashion',
    text: 'Garments and product drops can connect to campaign storytelling, authenticity, creator collaborations, and evolving branded digital experiences.',
    image: usecaseBrand,
    reverse: true,
  },
  {
    title: 'Corporate Identity',
    text: 'Uniforms, staff wear, and employee-facing items can link to role-based identity, department information, company presence, and internal or public representation.',
    image: usecaseCorporate,
    reverse: false,
  },
  {
    title: 'Hospitality & Guest Experience',
    text: 'VIP access, concierge experiences, premium events, and guest journeys can all be enhanced through QR-based identity and service layers.',
    image: usecaseHospitality,
    reverse: true,
  },
]

const secondaryCases = [
  {
    title: 'Events & Conferences',
    text: 'Badges and access points can become dynamic profiles for networking, schedule access, and live information.',
    image: usecaseEvent,
  },
  {
    title: 'Authentication & Security',
    text: 'Attach trusted digital proof to physical items and reduce counterfeit risk with secure identity logic.',
    image: usecaseAuth,
  },
  {
    title: 'Collectibles & Drops',
    text: 'Limited items like sneakers, jerseys, and special releases gain ownership and story layers.',
    image: usecaseCollectible,
  },
  {
    title: 'Campus & Education',
    text: 'Student events, clubs, access points, and campus communities can all use dynamic identity flows.',
    image: usecaseCampus,
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

function SectionIntro({ eyebrow, title, text, className = '' }) {
  return (
    <motion.div
      className={className}
      variants={fadeUp}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.45 }}
    >
      <div className="eyebrow mb-4">{eyebrow}</div>
      <h2 className="section-title mb-4">{title}</h2>
      {text ? <p className="lead">{text}</p> : null}
    </motion.div>
  )
}

export default function UseCases() {
  return (
    <div className="app-shell usecases-page min-h-screen bg-[#0A1F1F] text-white">
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="usecases-bg-orb usecases-bg-orb-1" />
      <div className="usecases-bg-orb usecases-bg-orb-2" />
      <div className="usecases-bg-orb usecases-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <section className="relative overflow-hidden px-4 pb-14 pt-12 md:pb-20 md:pt-16">
        <div className="container max-w-7xl">
          <div className="grid gap-10 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
            <motion.div
              className="max-w-2xl usecases-hero-copy"
              variants={heroStagger}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
                <div className="eyebrow mb-5">Use cases</div>
              </motion.div>

              <motion.h1
                className="section-title mb-5"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                One platform, many real-world identity experiences
              </motion.h1>

              <motion.p
                className="lead mb-8"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                Dresscode can power sportswear, luxury products, staff identity,
                hospitality, events, authentication, and collectible ecosystems.
                The same infrastructure adapts to different industries without
                losing brand control.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-3"
                variants={fadeUp}
                transition={{ duration: 0.45 }}
              >
                <Link to="/portal" className="btn btn-primary glow-btn">
                  Get Started
                </Link>
                <Link to="/solutions" className="btn btn-secondary">
                  View Solutions
                </Link>
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.55, delay: 0.1 }}
              className="usecases-hero-visual"
            >
              <div className="relative overflow-hidden rounded-[36px]">
                <div className="group relative overflow-hidden media-frame">
                  <img
                    src={heroImage}
                    alt="Dresscode use cases hero"
                    className="h-[520px] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/90 via-[#071515]/20 to-transparent" />
                  <div className="absolute inset-0 hero-image-shine" />
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <div className="mb-2 text-sm uppercase tracking-[0.18em] text-[#5ECFCF]">
                      Physical to digital
                    </div>
                    <div className="max-w-2xl text-3xl font-bold">
                      Identity infrastructure across multiple industries
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6">
        <div className="container max-w-7xl">
          <motion.div
            className="usecases-strip-shell border-y border-[rgba(94,207,207,0.10)] py-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm uppercase tracking-[0.14em] text-white/68">
              {stripItems.map((item) => (
                <span key={item} className="whitespace-nowrap">
                  {item}
                </span>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-7xl">
          <SectionIntro
            eyebrow="Featured sectors"
            title="Built to adapt without losing clarity"
            text="The same platform can serve public identity, official branded content, access layers, and secure ownership depending on the use case."
            className="mb-14 max-w-3xl"
          />

          <div className="grid gap-20">
            {featuredCases.map((item, index) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className={`grid gap-8 xl:grid-cols-[1fr_1fr] xl:items-center ${
                  item.reverse
                    ? 'xl:[&>*:first-child]:order-2 xl:[&>*:last-child]:order-1'
                    : ''
                }`}
              >
                <div className="overflow-hidden rounded-[34px]">
                  <div className="group relative overflow-hidden media-frame">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="h-[430px] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 hero-image-shine" />
                  </div>
                </div>

                <div className="max-w-2xl surface-card p-8 md:p-10">
                  <div className="eyebrow mb-4">Use case</div>
                  <h3 className="display mb-5 text-3xl font-bold">{item.title}</h3>
                  <p className="text-base leading-8 text-white/68">{item.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-7xl">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
            <SectionIntro
              eyebrow="More scenarios"
              title="Flexible enough for secure and niche experiences"
              text="Beyond the main verticals, Dresscode can support authentication, collectible ecosystems, education, and event-based identity systems."
              className=""
            />

            <div className="grid gap-8 md:grid-cols-2">
              {secondaryCases.map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.42, delay: index * 0.05 }}
                >
                  <div className="overflow-hidden rounded-[28px] mb-4">
                    <div className="group relative overflow-hidden media-frame">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="h-[260px] w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                      />
                      <div className="absolute inset-0 hero-image-shine" />
                    </div>
                  </div>

                  <h3 className="mb-3 text-2xl font-bold">{item.title}</h3>
                  <p className="text-sm leading-7 text-white/65">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-6 md:pb-24">
        <div className="container max-w-7xl">
          <div className="border-t border-[rgba(94,207,207,0.10)] pt-10">
            <motion.div
              className="usecases-cta-shell surface-card p-6 md:p-8"
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.15 }}
              transition={{ duration: 0.45 }}
            >
              <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-center">
                <div className="max-w-3xl">
                  <div className="eyebrow mb-4">Next step</div>
                  <h2 className="section-title mb-4">
                    Choose the experience, keep the same core infrastructure
                  </h2>
                  <p className="lead">
                    Whether you are building for sport, retail, enterprise, events,
                    hospitality, or secure product identity, Dresscode gives you one
                    system that can scale across all of them.
                  </p>
                </div>

                <div className="flex flex-col gap-4 md:flex-row">
                  <Link to="/portal" className="btn btn-primary glow-btn">
                    Open Portal
                  </Link>
                  <Link to="/contact" className="btn btn-secondary">
                    Contact Team
                  </Link>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </div>
  )
}