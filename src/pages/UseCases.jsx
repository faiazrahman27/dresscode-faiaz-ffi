import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

import heroImage from '../assets/home/usecase-hero.jpg'
import usecaseAthlete from '../assets/home/usecase-athlete.jpg'
import usecaseBrand from '../assets/home/usecase-brand.jpg'
import usecaseEvent from '../assets/home/usecase-event.jpg'
import usecaseCorporate from '../assets/home/usecase-corporate.jpg'
import usecaseHospitality from '../assets/home/usecase-hospitality.jpg'
import usecaseAuth from '../assets/home/usecase-authentication.jpg'
import usecaseCollectible from '../assets/home/usecase-collectible.jpg'
import usecaseCampus from '../assets/home/usecase-campus.jpg'

gsap.registerPlugin(ScrollTrigger)

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
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

export default function UseCases() {
  const rootRef = useRef(null)

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const cleanupFns = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.usecases-hero-copy > *',
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
        '.usecases-hero-visual',
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

      gsap.to('.usecases-bg-orb-1', {
        y: 22,
        x: 12,
        duration: 6.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.usecases-bg-orb-2', {
        y: -18,
        x: -12,
        duration: 7.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.usecases-bg-orb-3', {
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
    <div ref={rootRef} className="usecases-page min-h-screen bg-[#0A1F1F] text-white">
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
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.55 }}
              className="max-w-2xl usecases-hero-copy"
            >
              <div className="eyebrow mb-5">Use cases</div>
              <h1 className="section-title mb-5">
                One platform, many real-world identity experiences
              </h1>
              <p className="lead mb-8">
                Dresscode can power sportswear, luxury products, staff identity,
                hospitality, events, authentication, and collectible ecosystems.
                The same infrastructure adapts to different industries without
                losing brand control.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/portal" className="btn btn-primary glow-btn magnetic-btn">
                  Get Started
                </Link>
                <Link to="/solutions" className="btn btn-secondary magnetic-btn">
                  View Solutions
                </Link>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.65, delay: 0.08 }}
              className="usecases-hero-visual"
            >
              <div className="relative overflow-hidden rounded-[36px] tilt-card">
                <div className="tilt-inner media-frame">
                  <img
                    src={heroImage}
                    alt="Dresscode use cases hero"
                    className="parallax-media h-[520px] w-full object-cover"
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
          <div className="usecases-strip-shell border-y border-[rgba(94,207,207,0.10)] py-6 reveal-up">
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm uppercase tracking-[0.14em] text-white/68">
              {stripItems.map((item) => (
                <span key={item} className="whitespace-nowrap">
                  {item}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-7xl">
          <div className="mb-14 max-w-3xl reveal-up">
            <div className="eyebrow mb-4">Featured sectors</div>
            <h2 className="section-title mb-4">
              Built to adapt without losing clarity
            </h2>
            <p className="lead">
              The same platform can serve public identity, official branded content,
              access layers, and secure ownership depending on the use case.
            </p>
          </div>

          <div className="grid gap-20">
            {featuredCases.map((item, index) => (
              <motion.div
                key={item.title}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: index * 0.05 }}
                className={`grid gap-8 xl:grid-cols-[1fr_1fr] xl:items-center reveal-up ${
                  item.reverse
                    ? 'xl:[&>*:first-child]:order-2 xl:[&>*:last-child]:order-1'
                    : ''
                }`}
              >
                <div className="overflow-hidden rounded-[34px] tilt-card">
                  <div className="tilt-inner media-frame">
                    <img
                      src={item.image}
                      alt={item.title}
                      className="parallax-media h-[430px] w-full object-cover"
                    />
                    <div className="absolute inset-0 hero-image-shine" />
                  </div>
                </div>

                <div className="max-w-2xl surface-card p-8 md:p-10 tilt-card">
                  <div className="tilt-inner">
                    <div className="eyebrow mb-4">Use case</div>
                    <h3 className="display mb-5 text-3xl font-bold">{item.title}</h3>
                    <p className="text-base leading-8 text-white/68">{item.text}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-7xl">
          <div className="grid gap-10 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
            <div className="reveal-up">
              <div className="eyebrow mb-4">More scenarios</div>
              <h2 className="section-title mb-4">
                Flexible enough for secure and niche experiences
              </h2>
              <p className="lead">
                Beyond the main verticals, Dresscode can support authentication,
                collectible ecosystems, education, and event-based identity systems.
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-2">
              {secondaryCases.map((item, index) => (
                <motion.div
                  key={item.title}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.45, delay: index * 0.05 }}
                  className="reveal-scale"
                >
                  <div className="overflow-hidden rounded-[28px] mb-4 tilt-card">
                    <div className="tilt-inner media-frame">
                      <img
                        src={item.image}
                        alt={item.title}
                        className="parallax-media h-[260px] w-full object-cover"
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
            <div className="usecases-cta-shell surface-card tilt-card p-6 md:p-8 reveal-scale">
              <div className="tilt-inner">
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
          </div>
        </div>
      </section>
    </div>
  )
}
