import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import heroImage from '../assets/home/solution-hero.jpg'
import identityImage from '../assets/home/solution-identity.jpg'
import builderImage from '../assets/home/solution-builder.jpg'
import analyticsImage from '../assets/home/solution-analytics.jpg'
import officialImage from '../assets/home/solution-official.jpg'
import securityImage from '../assets/home/solution-security.jpg'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const pillars = [
  {
    number: '01',
    title: 'Identity layer',
    text: 'Every product, garment, badge, or collectible starts with a unique public code and optional scratch-based claiming.',
  },
  {
    number: '02',
    title: 'Experience layer',
    text: 'Each scan can open a dynamic public page, an official locked experience, or a controlled redirect flow.',
  },
  {
    number: '03',
    title: 'Control layer',
    text: 'Admins, templates, ownership logic, roles, and analytics keep the system structured and scalable.',
  },
]

const architecture = [
  'QR + scratch activation',
  'Ownership and assignment',
  'Page builder and templates',
  'Public profile experience',
  'Analytics and scan tracking',
]

export default function Solutions() {
  return (
    <div className="min-h-screen bg-[#0A1F1F] text-white">
      <section className="relative overflow-hidden px-4 pb-16 pt-12 md:pb-20 md:pt-16">
        <div className="container max-w-7xl">
          <div className="mb-10 max-w-4xl">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.55 }}
            >
              <div className="eyebrow mb-5">Solutions</div>
              <h1 className="section-title mb-5">
                The system behind physical-to-digital identity
              </h1>
              <p className="lead max-w-3xl">
                Dresscode is built as a layered platform: identity, activation,
                ownership, live content, official templates, and analytics working
                together inside one connected flow.
              </p>
            </motion.div>
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.65, delay: 0.08 }}
            className="relative overflow-hidden rounded-[38px]"
          >
            <img
              src={heroImage}
              alt="Dresscode solutions hero"
              className="h-[540px] w-full object-cover"
            />
            <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,21,21,0.88)_0%,rgba(7,21,21,0.58)_45%,rgba(7,21,21,0.20)_100%)]" />
            <div className="absolute inset-0 flex items-end">
              <div className="max-w-3xl px-8 py-10 md:px-12">
                <div className="mb-2 text-sm uppercase tracking-[0.18em] text-[#5ECFCF]">
                  One connected system
                </div>
                <div className="text-3xl font-bold md:text-4xl">
                  Identity, content, ownership, and analytics in one platform
                </div>

                <div className="mt-6 flex flex-wrap gap-3">
                  <Link to="/portal" className="btn btn-primary">
                    Open Portal
                  </Link>
                  <Link to="/contact" className="btn btn-secondary">
                    Contact Team
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-14">
        <div className="container max-w-7xl">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="eyebrow mb-4">Core pillars</div>
              <h2 className="section-title mb-4">
                Three layers hold the platform together
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-3">
              {pillars.map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.25 }}
                  transition={{ duration: 0.45, delay: index * 0.06 }}
                >
                  <div className="mb-4 text-4xl font-bold text-[#5ECFCF]">{item.number}</div>
                  <h3 className="mb-3 text-2xl font-semibold">{item.title}</h3>
                  <p className="text-sm leading-7 text-white/65">{item.text}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-14">
        <div className="container max-w-7xl">
          <div className="border-y border-[rgba(94,207,207,0.10)] py-6">
            <div className="mb-4 text-sm uppercase tracking-[0.14em] text-[#5ECFCF]">
              Architecture
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {architecture.map((item, index) => (
                <div key={item} className="text-sm text-white/72">
                  <div className="mb-2 text-[#5ECFCF]">{index + 1}.</div>
                  <div>{item}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-7xl">
          <div className="grid gap-16">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center"
            >
              <div className="overflow-hidden rounded-[34px]">
                <img
                  src={identityImage}
                  alt="QR identity engine"
                  className="h-[460px] w-full object-cover"
                />
              </div>

              <div className="max-w-xl">
                <div className="eyebrow mb-4">Solution 01</div>
                <h2 className="section-title mb-5">QR identity engine</h2>
                <p className="text-base leading-8 text-white/68">
                  Every item starts with a unique code. Open codes support editable public
                  identity, while locked codes support official template-driven experiences.
                  This creates a reliable base layer for products, uniforms, collectibles,
                  credentials, and event identity.
                </p>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr] xl:items-center"
            >
              <div className="max-w-xl">
                <div className="eyebrow mb-4">Solution 02</div>
                <h2 className="section-title mb-5">Builder and live page system</h2>
                <p className="text-base leading-8 text-white/68">
                  Profiles are not static. Users can build public pages with sections,
                  images, text, links, social blocks, and design settings. The result is
                  a live page that evolves over time instead of a dead destination.
                </p>
              </div>

              <div className="overflow-hidden rounded-[34px]">
                <img
                  src={builderImage}
                  alt="Dresscode builder"
                  className="h-[460px] w-full object-cover"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-7xl">
          <div className="mb-10 max-w-3xl">
            <div className="eyebrow mb-4">Official content</div>
            <h2 className="section-title mb-4">
              Locked experiences for premium control
            </h2>
            <p className="lead">
              This is where Dresscode moves beyond user profiles and becomes official brand infrastructure.
            </p>
          </div>

          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5 }}
            className="grid gap-8 xl:grid-cols-[1fr_0.9fr]"
          >
            <div className="overflow-hidden rounded-[36px] border border-[rgba(94,207,207,0.10)] bg-[rgba(255,255,255,0.02)] p-6">
              <div className="flex items-center justify-center rounded-[28px] bg-[#071515] p-4">
                <img
                  src={officialImage}
                  alt="Official branded content"
                  className="max-h-[500px] w-full object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col justify-center">
              <div className="eyebrow mb-4">Solution 03</div>
              <h3 className="section-title mb-5">Official content and templates</h3>
              <p className="text-base leading-8 text-white/68">
                Brands and admins can build template-based locked experiences to keep
                content consistent, premium, and controlled. This is where Dresscode
                becomes more than a user profile tool and starts acting like branded
                media infrastructure.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-7xl">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
            <div>
              <div className="eyebrow mb-4">Support layers</div>
              <h2 className="section-title mb-4">
                The system stays useful after the first scan
              </h2>
            </div>

            <div className="grid gap-10 md:grid-cols-2">
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45 }}
              >
                <div className="overflow-hidden rounded-[28px] mb-4">
                  <img
                    src={analyticsImage}
                    alt="Scan analytics"
                    className="h-[280px] w-full object-cover"
                  />
                </div>

                <div className="eyebrow mb-3">Insights</div>
                <h3 className="mb-3 text-2xl font-bold">Scan analytics</h3>
                <p className="text-sm leading-7 text-white/65">
                  Every public interaction can become measurable. Admins and users can
                  see scan activity, top-performing codes, and usage patterns that turn
                  static products into trackable digital touchpoints.
                </p>
              </motion.div>

              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: 0.05 }}
              >
                <div className="overflow-hidden rounded-[28px] mb-4">
                  <img
                    src={securityImage}
                    alt="Security and ownership"
                    className="h-[280px] w-full object-cover"
                  />
                </div>

                <div className="eyebrow mb-3">Trust</div>
                <h3 className="mb-3 text-2xl font-bold">Security and ownership</h3>
                <p className="text-sm leading-7 text-white/65">
                  Scratch activation, assignment, and ownership logic make the system
                  safer and more structured. This helps separate assigned, activated,
                  official, and editable experiences without confusion.
                </p>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-6 md:pb-24">
        <div className="container max-w-7xl">
          <div className="border-t border-[rgba(94,207,207,0.10)] pt-10">
            <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="max-w-3xl">
                <div className="eyebrow mb-4">Next step</div>
                <h2 className="section-title mb-4">
                  Build a system, not just a QR page
                </h2>
                <p className="lead">
                  Dresscode gives you the layers needed to connect physical items to live
                  identity, branded storytelling, and measurable interaction.
                </p>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                <Link to="/portal" className="btn btn-primary">
                  Get Started
                </Link>
                <Link to="/use-cases" className="btn btn-secondary">
                  Explore Use Cases
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
