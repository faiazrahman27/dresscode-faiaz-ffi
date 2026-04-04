import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import heroImage from '../assets/home/solution-hero.jpg'
import identityImage from '../assets/home/solution-identity.jpg'
import builderImage from '../assets/home/solution-builder.jpg'
import analyticsImage from '../assets/home/solution-analytics.jpg'
import officialImage from '../assets/home/solution-official.jpg'
import securityImage from '../assets/home/solution-security.jpg'

gsap.registerPlugin(ScrollTrigger)

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

export default function Solutions() {
  const rootRef = useRef(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const cleanupFns = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.solutions-hero-copy > *',
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.88,
          stagger: 0.08,
          ease: 'power3.out',
        }
      )

      gsap.fromTo(
        '.solutions-hero-visual',
        { opacity: 0, y: 42, scale: 0.975 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.95,
          ease: 'power3.out',
          delay: 0.12,
        }
      )

      gsap.utils.toArray('.reveal-up').forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 38 },
          {
            opacity: 1,
            y: 0,
            duration: 0.78,
            delay: i * 0.02,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 86%',
            },
          }
        )
      })

      gsap.utils.toArray('.reveal-scale').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
            },
          }
        )
      })

      gsap.utils.toArray('.parallax-media').forEach((el) => {
        gsap.fromTo(
          el,
          { y: -16 },
          {
            y: 16,
            ease: 'none',
            scrollTrigger: {
              trigger: el,
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
            },
          }
        )
      })

      gsap.to('.pulse-grid', {
        backgroundPosition: '220% 220%',
        duration: 22,
        repeat: -1,
        ease: 'none',
      })

      gsap.to('.solutions-bg-orb-1', {
        y: 22,
        x: 12,
        duration: 6.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.solutions-bg-orb-2', {
        y: -18,
        x: -12,
        duration: 7.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.solutions-bg-orb-3', {
        y: 14,
        x: 10,
        duration: 8.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.utils.toArray('.float-card').forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 === 0 ? -8 : 8,
          duration: 3.6 + i * 0.25,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })

      gsap.utils.toArray('.tilt-card').forEach((card) => {
        const inner = card.querySelector('.tilt-inner')
        if (!inner) return

        const handleMove = (e) => {
          const rect = card.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const rotateY = ((x / rect.width) - 0.5) * 8
          const rotateX = -((y / rect.height) - 0.5) * 8

          gsap.to(inner, {
            rotateX,
            rotateY,
            transformPerspective: 900,
            transformOrigin: 'center',
            duration: 0.3,
            ease: 'power2.out',
          })

          gsap.to(card, {
            '--spotlight-x': `${x}px`,
            '--spotlight-y': `${y}px`,
            duration: 0.22,
            ease: 'power2.out',
          })
        }

        const handleLeave = () => {
          gsap.to(inner, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.45,
            ease: 'power3.out',
          })
        }

        card.addEventListener('mousemove', handleMove)
        card.addEventListener('mouseleave', handleLeave)

        cleanupFns.push(() => {
          card.removeEventListener('mousemove', handleMove)
          card.removeEventListener('mouseleave', handleLeave)
        })
      })

      gsap.utils.toArray('.magnetic-btn').forEach((btn) => {
        const handleMove = (e) => {
          const rect = btn.getBoundingClientRect()
          const x = e.clientX - rect.left - rect.width / 2
          const y = e.clientY - rect.top - rect.height / 2

          gsap.to(btn, {
            x: x * 0.11,
            y: y * 0.11,
            duration: 0.28,
            ease: 'power3.out',
          })
        }

        const handleLeave = () => {
          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.45,
            ease: 'elastic.out(1, 0.45)',
          })
        }

        btn.addEventListener('mousemove', handleMove)
        btn.addEventListener('mouseleave', handleLeave)

        cleanupFns.push(() => {
          btn.removeEventListener('mousemove', handleMove)
          btn.removeEventListener('mouseleave', handleLeave)
        })
      })
    }, rootRef)

    return () => {
      cleanupFns.forEach((fn) => fn())
      ctx.revert()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

  return (
    <div ref={rootRef} className="app-shell solutions-page min-h-screen bg-[#0A1F1F] text-white">
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="solutions-bg-orb solutions-bg-orb-1" />
      <div className="solutions-bg-orb solutions-bg-orb-2" />
      <div className="solutions-bg-orb solutions-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <section className="relative overflow-hidden px-4 pb-16 pt-12 md:pb-20 md:pt-16">
        <div className="container max-w-7xl">
          <div className="mb-10 max-w-4xl solutions-hero-copy">
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
            className="relative overflow-hidden rounded-[38px] solutions-hero-visual tilt-card"
          >
            <div className="tilt-inner">
              <img
                src={heroImage}
                alt="Dresscode solutions hero"
                className="parallax-media h-[540px] w-full object-cover"
              />
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,21,21,0.88)_0%,rgba(7,21,21,0.58)_45%,rgba(7,21,21,0.20)_100%)]" />
              <div className="absolute inset-0 hero-image-shine" />
              <div className="absolute inset-0 flex items-end">
                <div className="max-w-3xl px-8 py-10 md:px-12">
                  <div className="mb-2 text-sm uppercase tracking-[0.18em] text-[#5ECFCF]">
                    One connected system
                  </div>
                  <div className="text-3xl font-bold md:text-4xl">
                    Identity, content, ownership, and analytics in one platform
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3">
                    <Link to="/portal" className="btn btn-primary glow-btn magnetic-btn">
                      Open Portal
                    </Link>
                    <Link to="/contact" className="btn btn-secondary magnetic-btn">
                      Contact Team
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-14">
        <div className="container max-w-7xl">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr]">
            <div className="reveal-up">
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
                  className="solutions-pillar-card reveal-scale tilt-card"
                >
                  <div className="tilt-inner">
                    <div className="mb-4 text-4xl font-bold text-[#5ECFCF]">{item.number}</div>
                    <h3 className="mb-3 text-2xl font-semibold">{item.title}</h3>
                    <p className="text-sm leading-7 text-white/65">{item.text}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-10 md:py-14">
        <div className="container max-w-7xl">
          <div className="solutions-architecture-shell border-y border-[rgba(94,207,207,0.10)] py-6 reveal-up">
            <div className="mb-4 text-sm uppercase tracking-[0.14em] text-[#5ECFCF]">
              Architecture
            </div>
            <div className="grid gap-4 md:grid-cols-5">
              {architecture.map((item, index) => (
                <div key={item} className="solutions-architecture-item float-card">
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
              className="grid gap-8 xl:grid-cols-[1.15fr_0.85fr] xl:items-center reveal-up"
            >
              <div className="overflow-hidden rounded-[34px] tilt-card">
                <div className="tilt-inner media-frame">
                  <img
                    src={identityImage}
                    alt="QR identity engine"
                    className="parallax-media h-[460px] w-full object-cover"
                  />
                  <div className="absolute inset-0 hero-image-shine" />
                </div>
              </div>

              <div className="max-w-xl surface-card p-8 md:p-10 tilt-card">
                <div className="tilt-inner">
                  <div className="eyebrow mb-4">Solution 01</div>
                  <h2 className="section-title mb-5">QR identity engine</h2>
                  <p className="text-base leading-8 text-white/68">
                    Every item starts with a unique code. Open codes support editable public
                    identity, while locked codes support official template-driven experiences.
                    This creates a reliable base layer for products, uniforms, collectibles,
                    credentials, and event identity.
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="grid gap-8 xl:grid-cols-[0.8fr_1.2fr] xl:items-center reveal-up"
            >
              <div className="max-w-xl surface-card p-8 md:p-10 tilt-card">
                <div className="tilt-inner">
                  <div className="eyebrow mb-4">Solution 02</div>
                  <h2 className="section-title mb-5">Builder and live page system</h2>
                  <p className="text-base leading-8 text-white/68">
                    Profiles are not static. Users can build public pages with sections,
                    images, text, links, social blocks, and design settings. The result is
                    a live page that evolves over time instead of a dead destination.
                  </p>
                </div>
              </div>

              <div className="overflow-hidden rounded-[34px] tilt-card">
                <div className="tilt-inner media-frame">
                  <img
                    src={builderImage}
                    alt="Dresscode builder"
                    className="parallax-media h-[460px] w-full object-cover"
                  />
                  <div className="absolute inset-0 hero-image-shine" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-7xl">
          <div className="mb-10 max-w-3xl reveal-up">
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
            className="grid gap-8 xl:grid-cols-[1fr_0.9fr] xl:items-center reveal-up"
          >
            <div className="overflow-hidden rounded-[34px] tilt-card">
              <div className="tilt-inner media-frame">
                <img
                  src={officialImage}
                  alt="Official branded content"
                  className="parallax-media h-[460px] w-full object-cover"
                />
                <div className="absolute inset-0 hero-image-shine" />
              </div>
            </div>

            <div className="flex flex-col justify-center surface-card p-8 md:p-10 tilt-card">
              <div className="tilt-inner">
                <div className="eyebrow mb-4">Solution 03</div>
                <h3 className="section-title mb-5">Official content and templates</h3>
                <p className="text-base leading-8 text-white/68">
                  Brands and admins can build template-based locked experiences to keep
                  content consistent, premium, and controlled. This is where Dresscode
                  becomes more than a user profile tool and starts acting like branded
                  media infrastructure.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-7xl">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
            <div className="reveal-up">
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
                className="reveal-scale"
              >
                <div className="mb-4 overflow-hidden rounded-[28px] tilt-card">
                  <div className="tilt-inner media-frame">
                    <img
                      src={analyticsImage}
                      alt="Scan analytics"
                      className="parallax-media h-[280px] w-full object-cover"
                    />
                    <div className="absolute inset-0 hero-image-shine" />
                  </div>
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
                className="reveal-scale"
              >
                <div className="mb-4 overflow-hidden rounded-[28px] tilt-card">
                  <div className="tilt-inner media-frame">
                    <img
                      src={securityImage}
                      alt="Security and ownership"
                      className="parallax-media h-[280px] w-full object-cover"
                    />
                    <div className="absolute inset-0 hero-image-shine" />
                  </div>
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
            <div className="solutions-cta-shell surface-card tilt-card p-6 md:p-8 reveal-scale">
              <div className="tilt-inner">
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
                    <Link to="/portal" className="btn btn-primary glow-btn magnetic-btn">
                      Get Started
                    </Link>
                    <Link to="/use-cases" className="btn btn-secondary magnetic-btn">
                      Explore Use Cases
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
