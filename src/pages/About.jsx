import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

import heroImage from '../assets/home/about-hero.jpg'
import visionImage from '../assets/home/about-vision.jpg'
import storyImage from '../assets/home/about-story.jpg'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const principles = [
  {
    title: 'Physical-first',
    text: 'The experience begins with a real object, garment, badge, or product in someone’s hand.',
  },
  {
    title: 'Digitally alive',
    text: 'What is scanned should not lead to a dead page. It should lead to something dynamic, current, and controlled.',
  },
  {
    title: 'Ownership matters',
    text: 'Identity should not be random. Activation, assignment, and control need structure.',
  },
  {
    title: 'Official and personal can coexist',
    text: 'Some experiences should be user-editable, while others should remain locked and brand-controlled.',
  },
]

export default function About() {
  return (
    <div className="min-h-screen bg-[#0A1F1F] text-white">
      <section className="relative overflow-hidden px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.55 }}
            >
              <div className="eyebrow mb-5">About Dresscode</div>
              <h1 className="section-title mb-5">
                Building identity infrastructure for the physical world
              </h1>
              <p className="lead mb-8">
                Dresscode was created around a simple belief: physical items should be
                able to carry structured, dynamic digital identity. A garment, a badge,
                a collectible, or a product should not stop at the object itself.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/solutions" className="btn btn-primary">
                  View Solutions
                </Link>
                <Link to="/contact" className="btn btn-secondary">
                  Contact Team
                </Link>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.65, delay: 0.08 }}
            >
              <div className="surface-card overflow-hidden p-3 md:p-4">
                <div className="group relative overflow-hidden rounded-[26px]">
                  <img
                    src={heroImage}
                    alt="About Dresscode"
                    className="h-[440px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/85 via-[#071515]/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <div className="mb-2 text-sm uppercase tracking-[0.18em] text-[#5ECFCF]">
                      Brand vision
                    </div>
                    <div className="text-2xl font-bold">
                      Physical presence with digital depth
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <div className="grid gap-8 xl:grid-cols-[0.95fr_1.05fr] xl:items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="surface-card overflow-hidden p-3"
            >
              <div className="group overflow-hidden rounded-[24px]">
                <img
                  src={storyImage}
                  alt="Dresscode brand story"
                  className="h-[380px] w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                />
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="surface-card p-8 md:p-10"
            >
              <div className="eyebrow mb-4">Why it exists</div>
              <h2 className="section-title mb-4">
                Most physical products still lead nowhere meaningful
              </h2>
              <p className="text-base leading-8 text-white/68">
                A QR code often opens a generic page, a one-time campaign, or nothing
                useful at all. Dresscode is designed to change that by making the
                relationship between product and digital identity structured, flexible,
                and long-lasting.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <div className="mb-12 max-w-3xl">
            <div className="eyebrow mb-4">What we believe</div>
            <h2 className="section-title mb-4">
              Identity should be layered, controlled, and alive
            </h2>
            <p className="lead">
              Dresscode is not built around static landing pages. It is built around
              repeat interaction, ownership logic, official content, and evolving public presence.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {principles.map((item, index) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.05 }}
                className="surface-card p-6"
              >
                <div className="mb-3 text-lg font-semibold">{item.title}</div>
                <p className="text-sm leading-7 text-white/65">{item.text}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <div className="grid gap-8 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="surface-card p-8 md:p-10"
            >
              <div className="eyebrow mb-4">Vision</div>
              <h2 className="section-title mb-4">
                A platform where products, people, and public identity connect naturally
              </h2>
              <p className="text-base leading-8 text-white/68">
                Dresscode can serve personal profiles, official brand media, event access,
                team identity, hospitality, authentication, and more — all from the same
                core system. The goal is not just to generate codes, but to create a durable
                infrastructure for physical-to-digital interaction.
              </p>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="surface-card overflow-hidden p-3"
            >
              <div className="group overflow-hidden rounded-[24px]">
                <img
                  src={visionImage}
                  alt="Dresscode vision"
                  className="h-[380px] w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <div className="glass-card overflow-hidden p-8 md:p-10">
            <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr] xl:items-center">
              <div>
                <div className="eyebrow mb-4">Next step</div>
                <h2 className="section-title mb-4">
                  See how the system works in practice
                </h2>
                <p className="lead">
                  Explore the product flow, use cases, and platform structure — or start
                  directly through the portal.
                </p>
              </div>

              <div className="flex flex-col gap-4 md:items-start xl:items-end">
                <Link to="/how-it-works" className="btn btn-primary">
                  How It Works
                </Link>
                <Link to="/portal" className="btn btn-secondary">
                  Open Portal
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
