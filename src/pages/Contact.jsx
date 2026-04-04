import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
}

const inquiryOptions = [
  {
    value: 'general',
    label: 'General inquiry',
    text: 'Questions about the platform, the flow, and how Dresscode works in practice.',
  },
  {
    value: 'partnerships',
    label: 'Partnerships',
    text: 'For fashion brands, teams, event organizers, hospitality groups, and enterprise use cases.',
  },
  {
    value: 'implementation',
    label: 'Implementation',
    text: 'For setup, rollout, templates, official content, and custom direction.',
  },
]

const signals = [
  'Fashion and product launches',
  'Teams and athlete identity',
  'Hospitality and guest journeys',
  'Events, badges, and access systems',
  'Enterprise identity and authentication',
]

const FORMSPREE_ENDPOINT = 'https://formspree.io/f/mjgpebzn'

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

export default function Contact() {
  const rootRef = useRef(null)

  const [form, setForm] = useState({
    name: '',
    email: '',
    inquiryType: 'general',
    company: '',
    message: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const cleanupFns = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.contact-hero-copy > *',
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
        '.contact-inquiry-col',
        { opacity: 0, x: -24, scale: 0.99 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.86,
          ease: 'power3.out',
          delay: 0.1,
        }
      )

      gsap.fromTo(
        '.contact-form-col',
        { opacity: 0, x: 24, scale: 0.985 },
        {
          opacity: 1,
          x: 0,
          scale: 1,
          duration: 0.92,
          ease: 'power3.out',
          delay: 0.14,
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

      gsap.to('.pulse-grid', {
        backgroundPosition: '220% 220%',
        duration: 22,
        repeat: -1,
        ease: 'none',
      })

      gsap.to('.contact-bg-orb-1', {
        y: 22,
        x: 12,
        duration: 6.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.contact-bg-orb-2', {
        y: -18,
        x: -12,
        duration: 7.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.contact-bg-orb-3', {
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

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    setSuccess('')
    setError('')

    try {
      const response = await fetch(FORMSPREE_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          inquiryType: form.inquiryType,
          company: form.company,
          message: form.message,
        }),
      })

      const data = await response.json().catch(() => null)

      if (!response.ok) {
        throw new Error(data?.error || 'Could not send your message.')
      }

      setSuccess('Your message has been sent successfully.')
      setForm({
        name: '',
        email: '',
        inquiryType: 'general',
        company: '',
        message: '',
      })
    } catch (err) {
      setError(err.message || 'Something went wrong while sending your message.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div ref={rootRef} className="app-shell contact-page min-h-screen bg-[#0A1F1F] text-white">
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="contact-bg-orb contact-bg-orb-1" />
      <div className="contact-bg-orb contact-bg-orb-2" />
      <div className="contact-bg-orb contact-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <section className="relative overflow-hidden px-4 pb-14 pt-12 md:pb-20 md:pt-16">
        <div className="hero-orb orb-1" />
        <div className="hero-orb orb-2" />

        <div className="container max-w-7xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.55 }}
            className="max-w-4xl contact-hero-copy"
          >
            <div className="eyebrow mb-5">Contact</div>
            <h1 className="section-title mb-5">
              Let’s talk about building identity around real-world products and experiences
            </h1>
            <p className="lead max-w-3xl">
              Dresscode works best when the goal is not just to place a QR code somewhere,
              but to create a structured digital layer around garments, products, people,
              events, or official brand content.
            </p>
          </motion.div>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="container max-w-7xl">
          <div className="grid gap-12 xl:grid-cols-[0.9fr_1.1fr] xl:items-start">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="contact-inquiry-col"
            >
              <div className="surface-card tilt-card p-6 md:p-8">
                <div className="tilt-inner">
                  <div className="contact-card-glow" />
                  <div className="mb-6 text-sm uppercase tracking-[0.16em] text-[#5ECFCF]">
                    Inquiry routes
                  </div>

                  <div className="border-t border-[rgba(94,207,207,0.10)]">
                    {inquiryOptions.map((item, index) => (
                      <div
                        key={item.value}
                        className="contact-inquiry-row grid gap-4 border-b border-[rgba(94,207,207,0.10)] py-6 md:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)] md:gap-8 reveal-up"
                      >
                        <div className="text-sm uppercase tracking-[0.14em] text-white/46">
                          {item.value}
                        </div>

                        <div className="min-w-0">
                          <h2 className="mb-2 text-2xl font-bold leading-[1.05]">
                            {item.label}
                          </h2>
                          <p className="text-sm leading-7 text-white/65">{item.text}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="contact-form-col"
            >
              <div className="glass-card contact-form-shell tilt-card p-8 md:p-10">
                <div className="tilt-inner">
                  <div className="mb-3 text-sm uppercase tracking-[0.18em] text-[#5ECFCF]">
                    Send a message
                  </div>

                  <h2 className="mb-6 text-3xl font-bold">Contact form</h2>

                  {success ? (
                    <div className="contact-feedback contact-feedback-success mb-4">
                      {success}
                    </div>
                  ) : null}

                  {error ? (
                    <div className="contact-feedback contact-feedback-error mb-4">
                      {error}
                    </div>
                  ) : null}

                  <form onSubmit={handleSubmit} className="grid gap-5">
                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="reveal-up">
                        <label className="mb-2 block text-sm font-medium">Name</label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          className="field"
                          placeholder="Your name"
                          required
                        />
                      </div>

                      <div className="reveal-up">
                        <label className="mb-2 block text-sm font-medium">Email</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          className="field"
                          placeholder="you@example.com"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid gap-5 md:grid-cols-2">
                      <div className="reveal-up">
                        <label className="mb-2 block text-sm font-medium">Inquiry type</label>
                        <select
                          name="inquiryType"
                          value={form.inquiryType}
                          onChange={handleChange}
                          className="field"
                        >
                          {inquiryOptions.map((item) => (
                            <option key={item.value} value={item.value}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="reveal-up">
                        <label className="mb-2 block text-sm font-medium">
                          Company / Organization
                        </label>
                        <input
                          type="text"
                          name="company"
                          value={form.company}
                          onChange={handleChange}
                          className="field"
                          placeholder="Optional"
                        />
                      </div>
                    </div>

                    <div className="reveal-up">
                      <label className="mb-2 block text-sm font-medium">Message</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        className="field min-h-[160px]"
                        placeholder="Tell me what you want to build or ask."
                        required
                      />
                    </div>

                    <button
                      type="submit"
                      className="btn btn-primary glow-btn magnetic-btn"
                      disabled={submitting}
                    >
                      {submitting ? 'Sending...' : 'Send Message'}
                    </button>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 py-14 md:py-20">
        <div className="container max-w-7xl">
          <div className="grid gap-10 xl:grid-cols-[0.85fr_1.15fr] xl:items-start">
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.5 }}
              className="reveal-up"
            >
              <div className="eyebrow mb-4">Best fit</div>
              <h2 className="section-title mb-4">
                The strongest conversations usually start from a clear use case
              </h2>
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: 0.05 }}
              className="grid gap-4 md:grid-cols-2"
            >
              {signals.map((item, index) => (
                <div
                  key={item}
                  className="contact-signal-card reveal-up float-card"
                >
                  {item}
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16 pt-6 md:pb-24">
        <div className="container max-w-7xl">
          <div className="border-t border-[rgba(94,207,207,0.10)] pt-10">
            <div className="contact-cta-shell surface-card tilt-card p-6 md:p-8 reveal-scale">
              <div className="tilt-inner">
                <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-center">
                  <div className="max-w-3xl">
                    <div className="eyebrow mb-4">Next step</div>
                    <p className="text-lg leading-8 text-white/62">
                      Before contacting, it usually helps to explore the use cases,
                      solutions, and product flow so the conversation becomes more specific.
                    </p>
                  </div>

                  <div className="flex flex-col gap-4 md:flex-row">
                    <Link to="/use-cases" className="btn btn-primary glow-btn magnetic-btn">
                      View Use Cases
                    </Link>
                    <Link to="/solutions" className="btn btn-secondary magnetic-btn">
                      View Solutions
                    </Link>
                    <Link to="/how-it-works" className="btn btn-secondary magnetic-btn">
                      How It Works
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
