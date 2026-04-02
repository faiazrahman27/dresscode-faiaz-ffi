import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useState } from 'react'

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

export default function Contact() {
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
    <div className="min-h-screen bg-[#0A1F1F] text-white">
      <section className="relative overflow-hidden px-4 pb-14 pt-12 md:pb-20 md:pt-16">
        <div className="hero-orb orb-1" />
        <div className="hero-orb orb-2" />

        <div className="container max-w-7xl">
          <motion.div
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.55 }}
            className="max-w-4xl"
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
            >
              <div className="mb-6 text-sm uppercase tracking-[0.16em] text-[#5ECFCF]">
                Inquiry routes
              </div>

              <div className="border-t border-[rgba(94,207,207,0.10)]">
                {inquiryOptions.map((item) => (
                  <div
                    key={item.value}
                    className="grid gap-4 border-b border-[rgba(94,207,207,0.10)] py-6 md:grid-cols-[160px_minmax(0,1fr)] lg:grid-cols-[180px_minmax(0,1fr)] md:gap-8"
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
            </motion.div>

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.55, delay: 0.05 }}
            >
              <div className="rounded-[34px] border border-[rgba(94,207,207,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-8 md:p-10">
                <div className="mb-3 text-sm uppercase tracking-[0.18em] text-[#5ECFCF]">
                  Send a message
                </div>

                <h2 className="mb-6 text-3xl font-bold">Contact form</h2>

                {success ? (
                  <div className="mb-4 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm">
                    {success}
                  </div>
                ) : null}

                {error ? (
                  <div className="mb-4 rounded-2xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm">
                    {error}
                  </div>
                ) : null}

                <form onSubmit={handleSubmit} className="grid gap-5">
                  <div className="grid gap-5 md:grid-cols-2">
                    <div>
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

                    <div>
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
                    <div>
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

                    <div>
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

                  <div>
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
                    className="btn btn-primary"
                    disabled={submitting}
                  >
                    {submitting ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
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
              {signals.map((item) => (
                <div
                  key={item}
                  className="border-b border-[rgba(94,207,207,0.10)] pb-4 text-base text-white/72"
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
            <div className="grid gap-6 xl:grid-cols-[1fr_auto] xl:items-center">
              <div className="max-w-3xl">
                <div className="eyebrow mb-4">Next step</div>
                <p className="text-lg leading-8 text-white/62">
                  Before contacting, it usually helps to explore the use cases,
                  solutions, and product flow so the conversation becomes more specific.
                </p>
              </div>

              <div className="flex flex-col gap-4 md:flex-row">
                <Link to="/use-cases" className="btn btn-primary">
                  View Use Cases
                </Link>
                <Link to="/solutions" className="btn btn-secondary">
                  View Solutions
                </Link>
                <Link to="/how-it-works" className="btn btn-secondary">
                  How It Works
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
