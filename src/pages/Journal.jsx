import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { getPublishedArticles } from '../lib/dashboard'

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

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
}

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

export default function Journal() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true

    async function loadArticles() {
      setLoading(true)
      setError('')

      const { data, error } = await getPublishedArticles()

      if (!active) return

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      setArticles(data || [])
      setLoading(false)
    }

    loadArticles()

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="app-shell journal-page min-h-screen bg-[#0A1F1F] text-white px-4 py-12">
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="journal-bg-orb journal-bg-orb-1" />
      <div className="journal-bg-orb journal-bg-orb-2" />
      <div className="journal-bg-orb journal-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={18} />

      <div className="container">
        <motion.div
          className="journal-hero-shell surface-card p-8 md:p-10 mb-10"
          variants={heroStagger}
          initial="hidden"
          animate="visible"
        >
          <div className="journal-card-glow" />
          <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
            <div className="eyebrow mb-4">Dresscode Journal</div>
          </motion.div>

          <motion.h1
            className="section-title mb-4"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            Stories, drops, ideas, and culture
          </motion.h1>

          <motion.p
            className="lead"
            variants={fadeUp}
            transition={{ duration: 0.5 }}
          >
            Published insights from the Dresscode platform. Explore stories,
            announcements, branded narratives, and editorial content.
          </motion.p>
        </motion.div>

        {loading ? (
          <motion.div
            className="surface-card p-8"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35 }}
          >
            <h2 className="display text-2xl font-bold">Loading articles...</h2>
          </motion.div>
        ) : null}

        {!loading && error ? (
          <motion.div
            className="surface-card p-8"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35 }}
          >
            <h2 className="display mb-3 text-2xl font-bold">Could not load journal</h2>
            <p className="muted">{error}</p>
          </motion.div>
        ) : null}

        {!loading && !error && articles.length === 0 ? (
          <motion.div
            className="surface-card p-8"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35 }}
          >
            <h2 className="display mb-3 text-2xl font-bold">No published articles yet</h2>
            <p className="muted">
              Articles will appear here once they are published from the dashboard.
            </p>
          </motion.div>
        ) : null}

        {!loading && !error && articles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article, index) => (
              <motion.article
                key={article.id}
                className="journal-article-card surface-card p-6"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.15 }}
                transition={{ duration: 0.4, delay: index * 0.04 }}
              >
                <div className="journal-article-glow" />

                <div className="mb-4 flex flex-wrap items-center gap-3">
                  {article.tag ? <span className="badge">{article.tag}</span> : null}
                  {article.date ? (
                    <span className="text-sm text-white/45">{formatDate(article.date)}</span>
                  ) : null}
                </div>

                <h2 className="display mb-4 text-2xl font-bold leading-tight">
                  {article.title}
                </h2>

                {article.excerpt ? (
                  <p className="mb-5 text-white/68 leading-7">{article.excerpt}</p>
                ) : null}

                <div className="mb-5 text-sm text-white/45">
                  {article.read_time || 'Read article'}
                </div>

                <div className="journal-content-shell rounded-[16px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
                  <div className="text-sm leading-7 text-white/60 line-clamp-5 whitespace-pre-wrap">
                    {article.content}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}