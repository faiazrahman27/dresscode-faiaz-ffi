import { useState } from 'react'
import { createArticle, updateArticle, deleteArticle } from '../lib/dashboard'

const emptyArticleForm = {
  title: '',
  tag: '',
  excerpt: '',
  content: '',
  read_time: '',
  published: false,
}

function buildArticleForm(article = {}) {
  return {
    title: article.title || '',
    tag: article.tag || '',
    excerpt: article.excerpt || '',
    content: article.content || '',
    read_time: article.read_time || '',
    published: Boolean(article.published),
  }
}

export default function JournalPanel({
  articles,
  user,
  setArticles,
  setError,
  setFeedback,
}) {
  const [form, setForm] = useState(emptyArticleForm)
  const [editingId, setEditingId] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFeedback('')

    if (!form.title || !form.content) {
      setError('Title and content are required.')
      return
    }

    const payload = {
      title: form.title,
      tag: form.tag,
      excerpt: form.excerpt,
      content: form.content,
      read_time: form.read_time,
      published: Boolean(form.published),
      author_id: user.id,
      date: new Date().toISOString().split('T')[0],
    }

    if (editingId) {
      const { data, error } = await updateArticle(editingId, payload)

      if (error) return setError(error.message)

      setArticles((prev) =>
        prev.map((a) => (a.id === editingId ? data : a))
      )

      setFeedback('Article updated.')
    } else {
      const { data, error } = await createArticle(payload)

      if (error) return setError(error.message)

      setArticles((prev) => [data, ...prev])

      setFeedback('Article created.')
    }

    setForm(emptyArticleForm)
    setEditingId(null)
  }

  function handleEdit(article) {
    setEditingId(article.id)
    setForm(buildArticleForm(article))
  }

  async function handleDelete(id) {
    if (!confirm('Delete this article?')) return

    const { error } = await deleteArticle(id)
    if (error) return setError(error.message)

    setArticles((prev) => prev.filter((a) => a.id !== id))
    setFeedback('Deleted.')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="surface-card p-6">
        <h2 className="mb-4 text-2xl font-bold">
          {editingId ? 'Edit Article' : 'Create Article'}
        </h2>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <input
            className="field"
            placeholder="Title"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />

          <input
            className="field"
            placeholder="Tag"
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
          />

          <input
            className="field"
            placeholder="Read Time (e.g. 5 min)"
            value={form.read_time}
            onChange={(e) => setForm({ ...form, read_time: e.target.value })}
          />

          <textarea
            className="field"
            placeholder="Excerpt"
            value={form.excerpt}
            onChange={(e) => setForm({ ...form, excerpt: e.target.value })}
          />

          <textarea
            className="field"
            rows={6}
            placeholder="Content"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
          />

          <label className="text-sm">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => setForm({ ...form, published: e.target.checked })}
            />
            Publish
          </label>

          <button className="btn btn-primary">
            {editingId ? 'Update' : 'Create'}
          </button>
        </form>
      </div>

      <div className="surface-card p-6">
        <h2 className="mb-4 text-2xl font-bold">Articles</h2>

        <div className="grid gap-4">
          {articles.map((a) => (
            <div key={a.id} className="rounded border p-3">
              <div className="font-bold">{a.title}</div>
              <div className="text-sm opacity-70">{a.tag}</div>
              <div className="text-sm">
                Published: {String(a.published)}
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(a)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(a.id)}
                  className="btn btn-secondary"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
