import { useMemo, useState } from 'react'
import {
  createShopProduct,
  updateShopProduct,
} from '../lib/dashboard'
import { formatShopPrice } from '../lib/shop'
import { uploadShopProductImage } from '../lib/storage'

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
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [imageUploading, setImageUploading] = useState(false)

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

    setFeedback('Image uploaded. Save the product to keep this image URL.')
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
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="eyebrow mb-3">Shop catalog</div>
            <h2 className="display text-3xl font-bold">Products and collectibles</h2>
            <p className="muted mt-3 max-w-3xl">
              Manage the public shop catalog from here. Images are uploaded to Supabase Storage and
              saved into the product record, so you do not need to hardcode image paths.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-2xl border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
              <div className="text-2xl font-bold text-[#5ECFCF]">{activeCount}</div>
              <div className="text-xs text-white/55">Active</div>
            </div>
            <div className="rounded-2xl border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
              <div className="text-2xl font-bold text-[#5ECFCF]">{productCount}</div>
              <div className="text-xs text-white/55">Products</div>
            </div>
            <div className="rounded-2xl border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-3">
              <div className="text-2xl font-bold text-[#5ECFCF]">{collectibleCount}</div>
              <div className="text-xs text-white/55">Collectibles</div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <div className="surface-card h-fit p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <div>
              <div className="eyebrow mb-3">{editingId ? 'Edit item' : 'Create item'}</div>
              <h3 className="display text-2xl font-bold">
                {editingId ? 'Update catalog item' : 'New catalog item'}
              </h3>
            </div>

            {editingId ? (
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
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
                <div className="mb-4 overflow-hidden rounded-2xl border border-[rgba(94,207,207,0.12)] bg-black/20">
                  <img
                    src={form.image_url}
                    alt={form.name || 'Shop product preview'}
                    className="h-44 w-full object-cover"
                  />
                </div>
              ) : (
                <div className="mb-4 flex h-44 items-center justify-center rounded-2xl border border-dashed border-[rgba(94,207,207,0.18)] bg-black/20 text-sm text-white/45">
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
                JPG, PNG, WebP, or GIF. Maximum 4 MB. Upload first, then save the product.
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
                  ? 'Uploading image...'
                  : editingId
                    ? 'Update Product'
                    : 'Create Product'}
            </button>
          </form>
        </div>

        <div className="grid gap-4">
          {sortedProducts.length === 0 ? (
            <div className="surface-card p-8">
              <h3 className="display mb-3 text-2xl font-bold">No shop products yet</h3>
              <p className="muted">
                Create products and collectibles here. They will appear on the public shop when
                active.
              </p>
            </div>
          ) : null}

          {sortedProducts.map((product) => (
            <div key={product.id} className="surface-card p-5">
              <div className="grid gap-5 lg:grid-cols-[190px_minmax(0,1fr)]">
                <div className="overflow-hidden rounded-2xl border border-[rgba(94,207,207,0.12)] bg-black/20">
                  {product.image_url ? (
                    <img
                      src={product.image_url}
                      alt={product.name}
                      className="h-44 w-full object-cover lg:h-full"
                    />
                  ) : (
                    <div className="flex h-44 items-center justify-center px-4 text-center text-sm text-white/45 lg:h-full">
                      No image
                    </div>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="mb-3 flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="mb-2 flex flex-wrap items-center gap-2">
                        <span className="rounded-full border border-[rgba(94,207,207,0.16)] bg-[rgba(94,207,207,0.08)] px-3 py-1 text-xs font-semibold text-[#5ECFCF]">
                          {categoryLabel(product.category)}
                        </span>
                        <span
                          className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                            product.is_active
                              ? 'border-emerald-400/20 bg-emerald-400/10 text-emerald-200'
                              : 'border-red-400/20 bg-red-400/10 text-red-200'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Hidden'}
                        </span>
                        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 text-xs text-white/60">
                          {product.code_type === 'locked' ? 'Locked' : 'Open'}
                        </span>
                      </div>

                      <h3 className="display truncate text-2xl font-bold">{product.name}</h3>
                      <div className="mt-1 break-all text-sm text-white/45">{product.slug}</div>
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-[#5ECFCF]">
                        {formatShopPrice(product.price_cents, product.currency)}
                      </div>
                      <div className="text-xs text-white/45">{product.qr_quantity} QR / item</div>
                    </div>
                  </div>

                  <p className="mb-4 line-clamp-3 text-sm leading-7 text-white/62">
                    {product.description || 'No description added.'}
                  </p>

                  <div className="mb-4 grid gap-3 md:grid-cols-3">
                    <div className="rounded-2xl border border-[rgba(94,207,207,0.1)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="text-xs text-white/45">Sort</div>
                      <div className="mt-1 font-semibold">{product.sort_order || 0}</div>
                    </div>

                    <div className="rounded-2xl border border-[rgba(94,207,207,0.1)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="text-xs text-white/45">Currency</div>
                      <div className="mt-1 font-semibold">{product.currency}</div>
                    </div>

                    <div className="rounded-2xl border border-[rgba(94,207,207,0.1)] bg-[rgba(255,255,255,0.02)] p-3">
                      <div className="text-xs text-white/45">Template</div>
                      <div className="mt-1 truncate font-semibold">
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
