import { useEffect, useMemo, useState } from 'react'
import {
  createShopProduct,
  updateShopProduct,
} from '../lib/dashboard'
import { formatShopPrice } from '../lib/shop'
import { uploadShopProductImage } from '../lib/storage'

const SHOP_PRODUCTS_DRAFT_STORAGE_KEY = 'dresscode.dashboard.shopProductsPanelDraft'

const EMPTY_FORM = {
  slug: '',
  name: '',
  category: 'qr_product',
  description: '',
  image_url: '',
  price: '12.00',
  currency: 'EUR',
  code_type: 'open',
  template_id: '',
  qr_quantity: 1,
  is_active: true,
  sort_order: 0,
}

const CATEGORY_OPTIONS = [
  { value: 'qr_product', label: 'Product' },
  { value: 'collectible', label: 'Collectible' },
  { value: 'wearable', label: 'Wearable' },
  { value: 'accessory', label: 'Accessory' },
  { value: 'digital', label: 'Digital' },
]

const CODE_TYPE_OPTIONS = [
  { value: 'open', label: 'Open code' },
  { value: 'locked', label: 'Locked template' },
]

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function getSavedDraft() {
  if (typeof window === 'undefined') {
    return {
      form: EMPTY_FORM,
      editingId: null,
    }
  }

  try {
    const rawDraft = window.sessionStorage.getItem(SHOP_PRODUCTS_DRAFT_STORAGE_KEY)

    if (!rawDraft) {
      return {
        form: EMPTY_FORM,
        editingId: null,
      }
    }

    const parsed = JSON.parse(rawDraft)

    if (!isPlainObject(parsed)) {
      return {
        form: EMPTY_FORM,
        editingId: null,
      }
    }

    const savedForm = isPlainObject(parsed.form) ? parsed.form : {}

    return {
      form: {
        ...EMPTY_FORM,
        ...savedForm,
        qr_quantity: Number(savedForm.qr_quantity || EMPTY_FORM.qr_quantity),
        sort_order: Number(savedForm.sort_order || EMPTY_FORM.sort_order),
        is_active:
          typeof savedForm.is_active === 'boolean'
            ? savedForm.is_active
            : EMPTY_FORM.is_active,
      },
      editingId:
        typeof parsed.editingId === 'string' && parsed.editingId.trim()
          ? parsed.editingId
          : null,
    }
  } catch {
    return {
      form: EMPTY_FORM,
      editingId: null,
    }
  }
}

function saveDraft(form, editingId) {
  if (typeof window === 'undefined') return

  try {
    window.sessionStorage.setItem(
      SHOP_PRODUCTS_DRAFT_STORAGE_KEY,
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
    window.sessionStorage.removeItem(SHOP_PRODUCTS_DRAFT_STORAGE_KEY)
  } catch {
    // Ignore storage failures.
  }
}

function slugify(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 140)
}

function categoryLabel(value) {
  return CATEGORY_OPTIONS.find((item) => item.value === value)?.label || 'Product'
}

function centsToPriceInput(cents) {
  const amount = Number(cents || 0) / 100
  return amount.toFixed(2)
}

function priceInputToCents(value) {
  const normalized = String(value || '0')
    .replace(',', '.')
    .replace(/[^\d.]/g, '')

  const amount = Number(normalized)

  if (!Number.isFinite(amount) || amount < 0) {
    return 0
  }

  return Math.round(amount * 100)
}

function getImageFolder(category) {
  if (category === 'collectible') return 'collectibles'
  return 'products'
}

function productToForm(product) {
  return {
    slug: product.slug || '',
    name: product.name || '',
    category: product.category || 'qr_product',
    description: product.description || '',
    image_url: product.image_url || '',
    price: centsToPriceInput(product.price_cents),
    currency: product.currency || 'EUR',
    code_type: product.code_type || 'open',
    template_id: product.template_id || '',
    qr_quantity: product.qr_quantity || 1,
    is_active: Boolean(product.is_active),
    sort_order: product.sort_order || 0,
  }
}

function formToPayload(form) {
  const codeType = form.code_type || 'open'

  return {
    slug: form.slug,
    name: form.name,
    category: form.category,
    description: form.description,
    image_url: form.image_url,
    price_cents: priceInputToCents(form.price),
    currency: String(form.currency || 'EUR').trim().toUpperCase(),
    code_type: codeType,
    template_id: codeType === 'locked' ? form.template_id || null : null,
    qr_quantity: Number(form.qr_quantity) || 1,
    is_active: Boolean(form.is_active),
    sort_order: Number(form.sort_order) || 0,
  }
}

export default function ShopProductsPanel({
  products,
  templates,
  saving,
  setSaving,
  setFeedback,
  setError,
  onCreated,
  onUpdated,
}) {
  const initialDraft = useMemo(() => getSavedDraft(), [])

  const [form, setForm] = useState(initialDraft.form)
  const [editingId, setEditingId] = useState(initialDraft.editingId)
  const [imageUploading, setImageUploading] = useState(false)

  useEffect(() => {
    saveDraft(form, editingId)
  }, [form, editingId])

  const sortedProducts = useMemo(() => {
    return [...(products || [])].sort((a, b) => {
      const orderA = Number(a.sort_order || 0)
      const orderB = Number(b.sort_order || 0)

      if (orderA !== orderB) return orderA - orderB

      return new Date(b.created_at || 0) - new Date(a.created_at || 0)
    })
  }, [products])

  const productCount = sortedProducts.filter((item) => item.category !== 'collectible').length
  const collectibleCount = sortedProducts.filter((item) => item.category === 'collectible').length
  const activeCount = sortedProducts.filter((item) => item.is_active).length

  function resetForm() {
    clearDraft()
    setForm(EMPTY_FORM)
    setEditingId(null)
  }

  function updateField(field, value) {
    setForm((prev) => {
      const next = {
        ...prev,
        [field]: value,
      }

      if (field === 'name' && !editingId) {
        next.slug = slugify(value)
      }

      if (field === 'code_type' && value === 'open') {
        next.template_id = ''
      }

      return next
    })
  }

  function handleEdit(product) {
    setEditingId(product.id)
    setForm(productToForm(product))
    setError('')
    setFeedback('')
  }

  async function handleImageUpload(file) {
    if (!file) return

    setImageUploading(true)
    setError('')
    setFeedback('')

    const { data, error } = await uploadShopProductImage(file, getImageFolder(form.category))

    setImageUploading(false)

    if (error) {
      setError(error.message || 'Image upload failed.')
      return
    }

    setForm((prev) => ({
      ...prev,
      image_url: data.publicUrl,
    }))

    setFeedback('Image uploaded as a square shop image. Save the product to keep this image URL.')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setSaving(true)
    setError('')
    setFeedback('')

    const payload = formToPayload(form)
    const request = editingId
      ? updateShopProduct(editingId, payload)
      : createShopProduct(payload)

    const { data, error } = await request

    setSaving(false)

    if (error) {
      setError(error.message || 'Could not save shop product.')
      return
    }

    if (editingId) {
      onUpdated(data)
      setFeedback('Shop product updated.')
    } else {
      onCreated(data)
      setFeedback('Shop product created.')
    }

    resetForm()
  }

  async function handleToggleActive(product) {
    setSaving(true)
    setError('')
    setFeedback('')

    const { data, error } = await updateShopProduct(product.id, {
      is_active: !product.is_active,
    })

    setSaving(false)

    if (error) {
      setError(error.message || 'Could not update product status.')
      return
    }

    onUpdated(data)
    setFeedback(product.is_active ? 'Product hidden from shop.' : 'Product restored to shop.')
  }

  return (
    <div className="grid gap-6">
      <div className="surface-card p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="min-w-0">
            <div className="eyebrow mb-3">Shop catalog</div>
            <h2 className="display text-3xl font-bold leading-tight">
              Products and collectibles
            </h2>
            <p className="muted mt-3 max-w-3xl leading-7">
              Manage the public shop catalog from here. Images are uploaded to Supabase Storage,
              prepared as square shop images, and saved into the product record.
            </p>
          </div>

          <div className="grid w-full shrink-0 grid-cols-3 gap-3 text-center sm:w-auto">
            <div className="min-w-0 rounded-2xl border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
              <div className="text-2xl font-bold leading-tight text-[#5ECFCF]">{activeCount}</div>
              <div className="mt-1 text-xs text-white/55">Active</div>
            </div>
            <div className="min-w-0 rounded-2xl border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
              <div className="text-2xl font-bold leading-tight text-[#5ECFCF]">{productCount}</div>
              <div className="mt-1 text-xs text-white/55">Products</div>
            </div>
            <div className="min-w-0 rounded-2xl border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] px-3 py-3">
              <div className="text-2xl font-bold leading-tight text-[#5ECFCF]">
                {collectibleCount}
              </div>
              <div className="mt-1 text-xs text-white/55">Collectibles</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="surface-card h-fit p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="eyebrow mb-3">{editingId ? 'Edit item' : 'Create item'}</div>
              <h3 className="display text-2xl font-bold leading-tight">
                {editingId ? 'Update catalog item' : 'New catalog item'}
              </h3>
            </div>

            {editingId ? (
              <button type="button" className="btn btn-ghost shrink-0" onClick={resetForm}>
                Cancel
              </button>
            ) : null}
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div>
              <label className="mb-2 block text-sm font-medium">Name</label>
              <input
                className="field"
                value={form.name}
                maxLength={160}
                onChange={(e) => updateField('name', e.target.value)}
                placeholder="Creator QR Card Pack"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Slug</label>
              <input
                className="field"
                value={form.slug}
                maxLength={140}
                onChange={(e) => updateField('slug', slugify(e.target.value))}
                placeholder="creator-qr-card-pack"
                required
              />
              <p className="mt-2 text-xs text-white/45">
                Lowercase letters, numbers, and hyphens only.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div>
                <label className="mb-2 block text-sm font-medium">Category</label>
                <select
                  className="field"
                  value={form.category}
                  onChange={(e) => updateField('category', e.target.value)}
                >
                  {CATEGORY_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Sort Order</label>
                <input
                  className="field"
                  type="number"
                  min={0}
                  max={100000}
                  value={form.sort_order}
                  onChange={(e) => updateField('sort_order', Number(e.target.value || 0))}
                />
              </div>
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium">Description</label>
              <textarea
                className="field"
                rows={4}
                value={form.description}
                maxLength={1200}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Describe what the product or collectible represents."
              />
            </div>

            <div className="rounded-[20px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
              <label className="mb-2 block text-sm font-medium">Product Image</label>

              {form.image_url ? (
                <div className="mb-4 aspect-square w-full overflow-hidden rounded-2xl border border-[rgba(94,207,207,0.12)] bg-black/20">
                  <img
                    src={form.image_url}
                    alt={form.name || 'Shop product preview'}
                    className="h-full w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-4 flex aspect-square w-full items-center justify-center rounded-2xl border border-dashed border-[rgba(94,207,207,0.18)] bg-black/20 px-4 text-center text-sm text-white/45">
                  No image uploaded
                </div>
              )}

              <input
                className="field"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                disabled={imageUploading || saving}
                onChange={(e) => handleImageUpload(e.target.files?.[0])}
              />

              <p className="mt-2 text-xs leading-5 text-white/45">
                Upload any JPG, PNG, WebP, or GIF under 4 MB. The app prepares it as a square shop
                image automatically.
              </p>

              <div className="mt-4">
                <label className="mb-2 block text-sm font-medium">Image URL</label>
                <input
                  className="field"
                  value={form.image_url}
                  onChange={(e) => updateField('image_url', e.target.value)}
                  placeholder="Uploaded public URL appears here"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div>
                <label className="mb-2 block text-sm font-medium">Price</label>
                <input
                  className="field"
                  inputMode="decimal"
                  value={form.price}
                  onChange={(e) => updateField('price', e.target.value)}
                  placeholder="12.00"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">Currency</label>
                <input
                  className="field"
                  value={form.currency}
                  maxLength={3}
                  onChange={(e) => updateField('currency', e.target.value.toUpperCase())}
                  placeholder="EUR"
                />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-1">
              <div>
                <label className="mb-2 block text-sm font-medium">Code Type</label>
                <select
                  className="field"
                  value={form.code_type}
                  onChange={(e) => updateField('code_type', e.target.value)}
                >
                  {CODE_TYPE_OPTIONS.map((item) => (
                    <option key={item.value} value={item.value}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium">QR Quantity</label>
                <input
                  className="field"
                  type="number"
                  min={1}
                  max={20}
                  value={form.qr_quantity}
                  onChange={(e) => updateField('qr_quantity', Number(e.target.value || 1))}
                />
              </div>
            </div>

            {form.code_type === 'locked' ? (
              <div>
                <label className="mb-2 block text-sm font-medium">Locked Template</label>
                <select
                  className="field"
                  value={form.template_id}
                  onChange={(e) => updateField('template_id', e.target.value)}
                  required
                >
                  <option value="">Select template</option>
                  {(templates || []).map((template) => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
                </select>
              </div>
            ) : null}

            <label className="flex items-start gap-3 rounded-2xl border border-[rgba(94,207,207,0.1)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/75">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) => updateField('is_active', e.target.checked)}
              />
              <span>
                Active in public shop
                <span className="mt-1 block text-xs text-white/45">
                  Inactive items remain in the database but are hidden from customers.
                </span>
              </span>
            </label>

            <button
              type="submit"
              className="btn btn-primary glow-btn"
              disabled={saving || imageUploading}
            >
              {saving
                ? 'Saving...'
                : imageUploading
                  ? 'Preparing square image...'
                  : editingId
                    ? 'Update Product'
                    : 'Create Product'}
            </button>
          </form>
        </div>

        <div className="grid min-w-0 gap-4">
          {sortedProducts.length === 0 ? (
            <div className="surface-card p-8">
              <h3 className="display mb-3 text-2xl font-bold leading-tight">
                No shop products yet
              </h3>
              <p className="muted leading-7">
                Create products and collectibles here. They will appear on the public shop when
                active.
              </p>
            </div>
          ) : null}

          {sortedProducts.map((product) => (
            <div key={product.id} className="surface-card overflow-hidden p-5">
              <div className="grid min-w-0 gap-5 2xl:grid-cols-[220px_minmax(0,1fr)] 2xl:items-start">
                <div className="aspect-square w-full max-w-[260px] overflow-hidden rounded-2xl border border-[rgba(94,207,207,0.12)] bg-black/20 2xl:w-[220px] 2xl:max-w-none">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center px-4 text-center text-sm text-white/45">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[rgba(94,207,207,0.16)] bg-[rgba(94,207,207,0.08)] px-3 py-1 text-xs font-semibold leading-5 text-[#5ECFCF]">
                          {categoryLabel(product.category)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold leading-5 ${
                            product.is_active
                              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                              : 'border-red-400/20 bg-red-400/10 text-red-200'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Hidden'}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs leading-5 text-white/60">
                          {product.code_type === 'locked' ? 'Locked' : 'Open'}
                        </span>
                      </div>
                    </div>

                    <div className="shrink-0 rounded-2xl border border-[rgba(94,207,207,0.1)] bg-[rgba(255,255,255,0.025)] px-4 py-3 text-left sm:text-right">
                      <div className="whitespace-nowrap text-2xl font-bold leading-tight text-[#5ECFCF]">
                        {formatShopPrice(product.price_cents, product.currency)}
                      </div>
                      <div className="mt-1 whitespace-nowrap text-xs text-white/45">
                        {product.qr_quantity} QR / item
                      </div>
                    </div>
                  </div>

                  <h3 className="display max-w-full whitespace-normal break-words text-xl font-bold leading-tight sm:text-2xl">
                    {product.name}
                  </h3>

                  <div className="mt-2 max-w-full break-all text-sm leading-5 text-white/45">
                    {product.slug}
                  </div>

                  <p className="mt-4 max-w-3xl whitespace-normal break-words text-sm leading-7 text-white/62">
                    {product.description || 'No description added.'}
                  </p>

                  <div className="my-4 grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3">
                    <div className="min-w-0 rounded-2xl border border-[rgba(94,207,207,0.1)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="text-xs text-white/45">Sort</div>
                      <div className="mt-1 whitespace-nowrap font-semibold">
                        {product.sort_order || 0}
                      </div>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-[rgba(94,207,207,0.1)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="text-xs text-white/45">Currency</div>
                      <div className="mt-1 whitespace-nowrap font-semibold">
                        {product.currency}
                      </div>
                    </div>

                    <div className="min-w-0 rounded-2xl border border-[rgba(94,207,207,0.1)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="text-xs text-white/45">Template</div>
                      <div className="mt-1 whitespace-nowrap font-semibold">
                        {product.template_id ? 'Assigned' : 'None'}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={() => handleEdit(product)}
                    >
                      Edit
                    </button>

                    <button
                      type="button"
                      className="btn btn-ghost"
                      disabled={saving}
                      onClick={() => handleToggleActive(product)}
                    >
                      {product.is_active ? 'Hide' : 'Restore'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
