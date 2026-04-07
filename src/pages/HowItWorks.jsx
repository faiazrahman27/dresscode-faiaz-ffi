import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import heroImage from '../assets/home/how-hero.jpg'
import scanImage from '../assets/home/how-scan.jpg'
import activateImage from '../assets/home/how-activate.jpg'
import buildImage from '../assets/home/how-build.jpg'
import shareImage from '../assets/home/how-share.jpg'

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

const flowSteps = [
  {
    no: '01',
    title: 'Scan the QR code',
    text: 'A visitor scans the QR code attached to the garment, product, badge, or collectible item. This becomes the entry point into the digital identity experience.',
    image: scanImage,
  },
  {
    no: '02',
    title: 'Activate ownership',
    text: 'If the code is meant to be claimed, the user signs in and enters the scratch code. This links the physical item to the correct account and prevents uncontrolled claiming.',
    image: activateImage,
  },
  {
    no: '03',
    title: 'Build the public page',
    text: 'Open codes can be edited through the page builder. Users can add visuals, links, sections, socials, and custom content to shape the live profile experience.',
    image: buildImage,
  },
  {
    no: '04',
    title: 'Publish and share',
    text: 'After setup, future scans open the live public page instantly. Depending on the code type, the page can be personal, official, locked, branded, or redirect-based.',
    image: shareImage,
  },
]

const highlights = [
  {
    title: 'Open codes',
    text: 'Editable by the activated owner through the builder.',
  },
  {
    title: 'Locked codes',
    text: 'Controlled through official templates and admin logic.',
  },
  {
    title: 'Analytics',
    text: 'Scans are recorded so engagement becomes measurable.',
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

function SectionIntro({ eyebrow, title, text }) {
  return (
    <motion.div
      className="mb-12 max-w-3xl"
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

export default function HowItWorks() {
  return (
    <div className="app-shell how-page min-h-screen bg-[#0A1F1F] text-white">
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="how-bg-orb how-bg-orb-1" />
      <div className="how-bg-orb how-bg-orb-2" />
      <div className="how-bg-orb how-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <section className="relative overflow-hidden px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
            <motion.div
              className="how-hero-copy"
              variants={heroStagger}
              initial="hidden"
              animate="visible"
            >
              <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
                <div className="eyebrow mb-5">How it works</div>
              </motion.div>

              <motion.h1
                className="section-title mb-5"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                A clear bridge between physical items and live digital identity
              </motion.h1>

              <motion.p
                className="lead mb-8"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                Dresscode turns a physical scan into a structured digital flow:
                entry, activation, ownership, editing, publishing, and ongoing interaction.
              </motion.p>

              <motion.div
                className="flex flex-wrap gap-3"
                variants={fadeUp}
                transition={{ duration: 0.45 }}
              >
                <Link to="/portal" className="btn btn-primary glow-btn">
                  Open Portal
                </Link>
                <Link to="/solutions" className="btn btn-secondary">
                  View Solutions
                </Link>
              </motion.div>

              <motion.div
                className="mt-10 grid gap-4 sm:grid-cols-3"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                {highlights.map((item) => (
                  <div key={item.title} className="glass-card p-5">
                    <div className="mb-2 text-lg font-semibold">{item.title}</div>
                    <div className="text-sm leading-7 text-white/62">{item.text}</div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.55, delay: 0.1 }}
              className="how-hero-visual"
            >
              <div className="surface-card overflow-hidden p-3 md:p-4">
                <div className="group relative flex items-center justify-center overflow-hidden rounded-[26px] bg-[#071515] media-frame">
                  <img
                    src={heroImage}
                    alt="How Dresscode works"
                    className="h-[440px] w-full object-contain transition duration-500 group-hover:scale-[1.02]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/80 via-[#071515]/10 to-transparent" />
                  <div className="absolute inset-0 hero-image-shine" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="mb-2 text-sm uppercase tracking-[0.18em] text-[#5ECFCF]">
                      Product flow
                    </div>
                    <div className="text-2xl font-bold">
                      Scan → activate → build → publish
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-6">
        <div className="container max-w-6xl">
          <motion.div
            className="how-step-overview rounded-[24px] border border-[rgba(94,207,207,0.10)] bg-[rgba(255,255,255,0.02)] p-6"
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45 }}
          >
            <div className="grid gap-4 md:grid-cols-4">
              {flowSteps.map((step, index) => (
                <motion.div
                  key={step.no}
                  className="how-step-chip rounded-[18px] border border-[rgba(94,207,207,0.08)] bg-[rgba(255,255,255,0.02)] px-4 py-4"
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.35, delay: index * 0.04 }}
                >
                  <div className="mb-2 text-sm uppercase tracking-[0.14em] text-[#5ECFCF]">
                    Step {step.no}
                  </div>
                  <div className="font-semibold">{step.title}</div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <SectionIntro
            eyebrow="The flow"
            title="The system becomes simple once each layer has a role"
            text="Each step solves a specific problem: discovery, ownership, content, and repeat interaction."
          />

          <div className="grid gap-12">
            {flowSteps.map((step, index) => (
              <motion.div
                key={step.no}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className={`grid gap-6 xl:grid-cols-[0.95fr_1.05fr] xl:items-center ${
                  index % 2 === 1
                    ? 'xl:[&>*:first-child]:order-2 xl:[&>*:last-child]:order-1'
                    : ''
                }`}
              >
                <div className="surface-card overflow-hidden p-3">
                  <div className="group relative flex items-center justify-center overflow-hidden rounded-[24px] bg-[#071515] media-frame">
                    <img
                      src={step.image}
                      alt={step.title}
                      className="h-[360px] w-full object-cover transition duration-500 group-hover:scale-[1.02]"
                    />
                    <div className="absolute inset-0 hero-image-shine" />
                  </div>
                </div>

                <div className="surface-card p-8 md:p-10">
                  <div className="eyebrow mb-4">Step {step.no}</div>
                  <h3 className="display mb-4 text-3xl font-bold">{step.title}</h3>
                  <p className="text-base leading-8 text-white/68">{step.text}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <div className="grid gap-6 lg:grid-cols-3">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.42 }}
              className="surface-card p-6"
            >
              <div className="eyebrow mb-3">Ownership</div>
              <h3 className="mb-3 text-2xl font-bold">Claimed with control</h3>
              <p className="text-sm leading-7 text-white/65">
                Scratch activation helps separate physical possession from public access.
                This keeps ownership more structured and harder to fake.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.42, delay: 0.05 }}
              className="surface-card p-6"
            >
              <div className="eyebrow mb-3">Content</div>
              <h3 className="mb-3 text-2xl font-bold">Open or official</h3>
              <p className="text-sm leading-7 text-white/65">
                Open codes support user customization. Locked codes support template-based
                official experiences controlled by admins and brands.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.42, delay: 0.1 }}
              className="surface-card p-6"
            >
              <div className="eyebrow mb-3">Insights</div>
              <h3 className="mb-3 text-2xl font-bold">Trackable interaction</h3>
              <p className="text-sm leading-7 text-white/65">
                Once the public page is live, scans become engagement data. This turns
                physical items into measurable digital touchpoints.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.15 }}
            transition={{ duration: 0.45 }}
            className="glass-card overflow-hidden p-8 md:p-10"
          >
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
              <div>
                <div className="eyebrow mb-4">Ready to try it</div>
                <h2 className="section-title mb-4">
                  Start with the portal, then build from the physical item outward
                </h2>
                <p className="lead">
                  Dresscode works best when the product flow stays simple for the user
                  and powerful behind the scenes for the platform.
                </p>
              </div>

              <div className="flex flex-col gap-4 md:items-start xl:items-end">
                <Link to="/portal" className="btn btn-primary glow-btn">
                  Get Started
                </Link>
                <Link to="/use-cases" className="btn btn-secondary">
                  Explore Use Cases
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  )
}