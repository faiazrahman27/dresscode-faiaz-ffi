import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import heroImage from '../assets/home/about-hero.jpg'
import visionImage from '../assets/home/about-vision.jpg'
import storyImage from '../assets/home/about-story.jpg'

gsap.registerPlugin(ScrollTrigger)

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

export default function About() {
  const rootRef = useRef(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const cleanupFns = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.about-hero-copy > *',
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
        '.about-hero-visual',
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

      gsap.to('.about-bg-orb-1', {
        y: 22,
        x: 12,
        duration: 6.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.about-bg-orb-2', {
        y: -18,
        x: -12,
        duration: 7.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.about-bg-orb-3', {
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
    <div ref={rootRef} className="about-page min-h-screen bg-[#0A1F1F] text-white">
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="about-bg-orb about-bg-orb-1" />
      <div className="about-bg-orb about-bg-orb-2" />
      <div className="about-bg-orb about-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <section className="relative overflow-hidden px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <div className="grid gap-8 xl:grid-cols-[1.02fr_0.98fr] xl:items-center">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.55 }}
              className="about-hero-copy"
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
                <Link to="/solutions" className="btn btn-primary glow-btn magnetic-btn">
                  View Solutions
                </Link>
                <Link to="/contact" className="btn btn-secondary magnetic-btn">
                  Contact Team
                </Link>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.65, delay: 0.08 }}
              className="about-hero-visual"
            >
              <div className="surface-card overflow-hidden p-3 md:p-4 tilt-card">
                <div className="tilt-inner">
                  <div className="group relative overflow-hidden rounded-[26px] media-frame">
                    <img
                      src={heroImage}
                      alt="About Dresscode"
                      className="parallax-media h-[440px] w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#071515]/85 via-[#071515]/20 to-transparent" />
                    <div className="absolute inset-0 hero-image-shine" />
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
              className="surface-card overflow-hidden p-3 tilt-card reveal-up"
            >
              <div className="tilt-inner">
                <div className="group overflow-hidden rounded-[24px] media-frame">
                  <img
                    src={storyImage}
                    alt="Dresscode brand story"
                    className="parallax-media h-[380px] w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 hero-image-shine" />
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="surface-card p-8 md:p-10 tilt-card reveal-up"
            >
              <div className="tilt-inner">
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
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <div className="mb-12 max-w-3xl reveal-up">
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
                className="surface-card p-6 tilt-card reveal-scale float-card"
              >
                <div className="tilt-inner">
                  <div className="mb-3 text-lg font-semibold">{item.title}</div>
                  <p className="text-sm leading-7 text-white/65">{item.text}</p>
                </div>
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
              className="surface-card p-8 md:p-10 tilt-card reveal-up"
            >
              <div className="tilt-inner">
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
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="surface-card overflow-hidden p-3 tilt-card reveal-up"
            >
              <div className="tilt-inner">
                <div className="group overflow-hidden rounded-[24px] media-frame">
                  <img
                    src={visionImage}
                    alt="Dresscode vision"
                    className="parallax-media h-[380px] w-full object-cover transition duration-500 group-hover:scale-[1.05]"
                  />
                  <div className="absolute inset-0 hero-image-shine" />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-12 md:py-16">
        <div className="container max-w-6xl">
          <div className="glass-card overflow-hidden p-8 md:p-10 tilt-card reveal-up">
            <div className="tilt-inner">
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
                  <Link to="/how-it-works" className="btn btn-primary glow-btn magnetic-btn">
                    How It Works
                  </Link>
                  <Link to="/portal" className="btn btn-secondary magnetic-btn">
                    Open Portal
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
