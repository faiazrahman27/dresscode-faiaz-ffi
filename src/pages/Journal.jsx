import { useEffect, useState } from 'react'
import { getPublishedArticles } from '../lib/dashboard'

function formatDate(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString()
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
    <div className="min-h-screen bg-[#0A1F1F] text-white px-4 py-12">
      <div className="container">
        <div className="mb-10 max-w-3xl">
          <div className="eyebrow mb-4">Dresscode Journal</div>
          <h1 className="section-title mb-4">Stories, drops, ideas, and culture</h1>
          <p className="lead">
            Published insights from the Dresscode platform. Explore stories,
            announcements, branded narratives, and editorial content.
          </p>
        </div>

        {loading ? (
          <div className="surface-card p-8">
            <h2 className="display text-2xl font-bold">Loading articles...</h2>
          </div>
        ) : null}

        {!loading && error ? (
          <div className="surface-card p-8">
            <h2 className="display mb-3 text-2xl font-bold">Could not load journal</h2>
            <p className="muted">{error}</p>
          </div>
        ) : null}

        {!loading && !error && articles.length === 0 ? (
          <div className="surface-card p-8">
            <h2 className="display mb-3 text-2xl font-bold">No published articles yet</h2>
            <p className="muted">
              Articles will appear here once they are published from the dashboard.
            </p>
          </div>
        ) : null}

        {!loading && !error && articles.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {articles.map((article) => (
              <article key={article.id} className="surface-card p-6">
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

                <div className="rounded-[16px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
                  <div className="text-sm leading-7 text-white/60 line-clamp-5 whitespace-pre-wrap">
                    {article.content}
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
