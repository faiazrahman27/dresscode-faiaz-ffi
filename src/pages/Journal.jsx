import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { getPublishedArticles } from '../lib/dashboard'

gsap.registerPlugin(ScrollTrigger)

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
  const rootRef = useRef(null)
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const cleanupFns = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.journal-hero-copy > *',
        { opacity: 0, y: 36 },
        {
          opacity: 1,
          y: 0,
          duration: 0.88,
          stagger: 0.08,
          ease: 'power3.out',
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

      gsap.to('.journal-bg-orb-1', {
        y: 22,
        x: 12,
        duration: 6.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.journal-bg-orb-2', {
        y: -18,
        x: -12,
        duration: 7.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.journal-bg-orb-3', {
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
    }, rootRef)

    return () => {
      cleanupFns.forEach((fn) => fn())
      ctx.revert()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

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
    <div ref={rootRef} className="journal-page min-h-screen bg-[#0A1F1F] text-white px-4 py-12">
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
        <div className="journal-hero-shell surface-card tilt-card p-8 md:p-10 mb-10">
          <div className="tilt-inner journal-hero-copy">
            <div className="journal-card-glow" />
            <div className="eyebrow mb-4">Dresscode Journal</div>
            <h1 className="section-title mb-4">Stories, drops, ideas, and culture</h1>
            <p className="lead">
              Published insights from the Dresscode platform. Explore stories,
              announcements, branded narratives, and editorial content.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="surface-card p-8 tilt-card reveal-scale">
            <div className="tilt-inner">
              <h2 className="display text-2xl font-bold">Loading articles...</h2>
            </div>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="surface-card p-8 tilt-card reveal-scale">
            <div className="tilt-inner">
              <h2 className="display mb-3 text-2xl font-bold">Could not load journal</h2>
              <p className="muted">{error}</p>
            </div>
          </div>
        ) : null}

        {!loading && !error && articles.length === 0 ? (
          <div className="surface-card p-8 tilt-card reveal-scale">
            <div className="tilt-inner">
              <h2 className="display mb-3 text-2xl font-bold">No published articles yet</h2>
              <p className="muted">
                Articles will appear here once they are published from the dashboard.
              </p>
            </div>
          </div>
        ) : null}

        {!loading && !error && articles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article, index) => (
              <article
                key={article.id}
                className="journal-article-card surface-card p-6 tilt-card reveal-up"
              >
                <div className="tilt-inner">
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
                </div>
              </article>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  )
}
