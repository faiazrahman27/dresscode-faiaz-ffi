import { useEffect, useState } from 'react'
import { createArticle, updateArticle, deleteArticle } from '../lib/dashboard'

const JOURNAL_DRAFT_STORAGE_KEY = 'dresscode.dashboard.journalPanelDraft'

const emptyArticleForm = {
  title: '',
  tag: '',
  excerpt: '',
  content: '',
  read_time: '',
  published: false,
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
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

function getSavedDraft() {
  if (typeof window === 'undefined') {
    return {
      form: emptyArticleForm,
      editingId: null,
    }
  }

  try {
    const rawDraft = window.sessionStorage.getItem(JOURNAL_DRAFT_STORAGE_KEY)

    if (!rawDraft) {
      return {
        form: emptyArticleForm,
        editingId: null,
      }
    }

    const parsed = JSON.parse(rawDraft)

    if (!isPlainObject(parsed)) {
      return {
        form: emptyArticleForm,
        editingId: null,
      }
    }

    const savedForm = isPlainObject(parsed.form) ? parsed.form : {}

    return {
      form: {
        ...emptyArticleForm,
        ...savedForm,
        published:
          typeof savedForm.published === 'boolean'
            ? savedForm.published
            : emptyArticleForm.published,
      },
      editingId:
        typeof parsed.editingId === 'string' && parsed.editingId.trim()
          ? parsed.editingId
          : null,
    }
  } catch {
    return {
      form: emptyArticleForm,
      editingId: null,
    }
  }
}

function saveDraft(form, editingId) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(
      JOURNAL_DRAFT_STORAGE_KEY,
      JSON.stringify({
        form,
        editingId,
        savedAt: new Date().toISOString(),
      }),
    )
  } catch {
    // Local draft persistence is a convenience feature. Ignore storage failures.
  }
}

function clearDraft() {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.removeItem(JOURNAL_DRAFT_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}

export default function JournalPanel({
  articles,
  user,
  setArticles,
  setError,
  setFeedback,
}) {
  const [draft, setDraft] = useState(() => getSavedDraft())
  const [form, setForm] = useState(() => draft.form)
  const [editingId, setEditingId] = useState(() => draft.editingId)

  useEffect(() => {
    saveDraft(form, editingId)
  }, [form, editingId])

  function updateFormField(field, value) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  function resetForm() {
    clearDraft()
    setForm(emptyArticleForm)
    setEditingId(null)
    setDraft({
      form: emptyArticleForm,
      editingId: null,
    })
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setFeedback('')

    if (!form.title || !form.content) {
      setError('Title and content are required.')
      return
    }

    if (!user?.id) {
      setError('User context is missing.')
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

      if (error) {
        setError(error.message)
        return
      }

      setArticles((prev) =>
        prev.map((article) => (article.id === editingId ? data : article)),
      )

      setFeedback('Article updated.')
    } else {
      const { data, error } = await createArticle(payload)

      if (error) {
        setError(error.message)
        return
      }

      setArticles((prev) => [data, ...prev])
      setFeedback('Article created.')
    }

    resetForm()
  }

  function handleEdit(article) {
    setEditingId(article.id)
    setForm(buildArticleForm(article))
    setError('')
    setFeedback('')
  }

  async function handleDelete(id) {
    const confirmed = confirm('Delete this article?')
    if (!confirmed) return

    setError('')
    setFeedback('')

    const { error } = await deleteArticle(id)

    if (error) {
      setError(error.message)
      return
    }

    if (editingId === id) {
      resetForm()
    }

    setArticles((prev) => prev.filter((article) => article.id !== id))
    setFeedback('Deleted.')
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
      <div className="surface-card p-6">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="eyebrow mb-3">Journal editor</div>
            <h2 className="display text-2xl font-bold leading-tight">
              {editingId ? 'Edit Article' : 'Create Article'}
            </h2>
          </div>

          {editingId ? (
            <button type="button" className="btn btn-ghost" onClick={resetForm}>
              Cancel
            </button>
          ) : null}
        </div>

        <form onSubmit={handleSubmit} className="grid gap-3">
          <input
            className="field"
            placeholder="Title"
            value={form.title}
            maxLength={180}
            onChange={(e) => updateFormField('title', e.target.value)}
          />

          <input
            className="field"
            placeholder="Tag"
            value={form.tag}
            maxLength={80}
            onChange={(e) => updateFormField('tag', e.target.value)}
          />

          <input
            className="field"
            placeholder="Read Time (e.g. 5 min)"
            value={form.read_time}
            maxLength={80}
            onChange={(e) => updateFormField('read_time', e.target.value)}
          />

          <textarea
            className="field"
            placeholder="Excerpt"
            value={form.excerpt}
            maxLength={500}
            onChange={(e) => updateFormField('excerpt', e.target.value)}
          />

          <textarea
            className="field"
            rows={6}
            placeholder="Content"
            value={form.content}
            maxLength={20000}
            onChange={(e) => updateFormField('content', e.target.value)}
          />

          <label className="flex items-center gap-3 rounded-2xl border border-[rgba(94,207,207,0.1)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/75">
            <input
              type="checkbox"
              checked={form.published}
              onChange={(e) => updateFormField('published', e.target.checked)}
            />
            <span>Publish</span>
          </label>

          <button type="submit" className="btn btn-primary">
            {editingId ? 'Update' : 'Create'}
          </button>
        </form>
      </div>

      <div className="surface-card p-6">
        <div className="eyebrow mb-3">Articles</div>
        <h2 className="display mb-4 text-2xl font-bold">Articles</h2>

        <div className="grid gap-4">
          {articles.length === 0 ? (
            <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/55">
              No articles yet.
            </div>
          ) : null}

          {articles.map((article) => (
            <div
              key={article.id}
              className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4"
            >
              <div className="break-words font-bold">{article.title}</div>
              <div className="mt-1 break-words text-sm text-white/70">
                {article.tag}
              </div>
              <div className="mt-2 text-sm text-white/60">
                Published: {String(article.published)}
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => handleEdit(article)}
                  className="btn btn-secondary"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(article.id)}
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
