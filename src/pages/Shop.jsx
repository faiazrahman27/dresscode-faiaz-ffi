import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import {
  createSimulatedShopOrder,
  formatShopPrice,
  getShopProducts,
} from '../lib/shop'

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
}

const stagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

function GlitterField({ count = 18 }) {
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

function formatCategory(value) {
  return String(value || 'product')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())
}

function getOrigin() {
  if (typeof window === 'undefined') return ''
  return window.location.origin
}

function getActivationUrl(code) {
  const origin = getOrigin()
  return `${origin}/activate/${code}`
}

function getPublicUrl(code) {
  const origin = getOrigin()
  return `${origin}/p/${code}`
}

async function copyText(value) {
  if (!value) return

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(value)
  }
}

export default function Shop() {
  const [products, setProducts] = useState([])
  const [selectedProductId, setSelectedProductId] = useState('')
  const [buyerName, setBuyerName] = useState('')
  const [buyerEmail, setBuyerEmail] = useState('')
  const [quantity, setQuantity] = useState(1)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [orderResult, setOrderResult] = useState(null)

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) || null,
    [products, selectedProductId],
  )

  const totalPrice = useMemo(() => {
    if (!selectedProduct) return formatShopPrice(0, 'EUR')

    return formatShopPrice(
      selectedProduct.price_cents * Number(quantity || 1),
      selectedProduct.currency,
    )
  }, [selectedProduct, quantity])

  useEffect(() => {
    let active = true

    async function loadProducts() {
      setLoading(true)
      setError('')
      setFeedback('')

      const { data, error } = await getShopProducts()

      if (!active) return

      if (error) {
        setProducts([])
        setError(error.message || 'Could not load shop products.')
        setLoading(false)
        return
      }

      setProducts(data)

      if (data.length > 0) {
        setSelectedProductId(data[0].id)
      }

      setLoading(false)
    }

    loadProducts()

    return () => {
      active = false
    }
  }, [])

  function handleSelectProduct(productId) {
    setSelectedProductId(productId)
    setOrderResult(null)
    setError('')
    setFeedback('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    setError('')
    setFeedback('')
    setOrderResult(null)

    if (!selectedProduct) {
      setError('Select a product first.')
      return
    }

    if (!buyerEmail.trim()) {
      setError('Buyer email is required.')
      return
    }

    setSubmitting(true)

    const { data, error } = await createSimulatedShopOrder({
      productId: selectedProduct.id,
      buyerEmail,
      buyerName,
      quantity,
    })

    setSubmitting(false)

    if (error) {
      const retryText = error.retryAfterSeconds
        ? ` Try again in ${error.retryAfterSeconds} seconds.`
        : ''

      setError(`${error.message || 'Could not create simulated order.'}${retryText}`)
      return
    }

    setOrderResult(data)
    setFeedback('Simulated order created. QR code assignment is ready.')
  }

  return (
    <div className="app-shell editor-page min-h-screen bg-[#0A1F1F] px-4 py-8 text-white">
      <div className="page-noise" />
      <div className="pulse-grid" />
      <div className="ambient-line ambient-line-1" />
      <div className="ambient-line ambient-line-2" />
      <div className="editor-bg-orb editor-bg-orb-1" />
      <div className="editor-bg-orb editor-bg-orb-2" />
      <div className="editor-bg-orb editor-bg-orb-3" />
      <div className="hero-ring hero-ring-1" />
      <div className="hero-ring hero-ring-2" />
      <GlitterField count={20} />

      <div className="container">
        <motion.div
          className="editor-hero-card surface-card mb-6 p-6 md:p-8"
          variants={stagger}
          initial="hidden"
          animate="visible"
        >
          <div className="editor-card-glow" />

          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <motion.div variants={fadeUp} transition={{ duration: 0.35 }}>
                <div className="eyebrow mb-3">Simulated shop</div>
              </motion.div>

              <motion.h1
                className="section-title mb-3"
                variants={fadeUp}
                transition={{ duration: 0.4 }}
              >
                QR products and collectibles
              </motion.h1>

              <motion.p
                className="muted max-w-3xl"
                variants={fadeUp}
                transition={{ duration: 0.35 }}
              >
                Test the future purchase flow without payment. A simulated order creates buyer-bound
                QR codes, assigns them to the entered email, and keeps the activation flow protected.
              </motion.p>
            </div>

            <motion.div
              className="flex flex-wrap gap-3"
              variants={fadeUp}
              transition={{ duration: 0.35 }}
            >
              <Link to="/" className="btn btn-secondary">
                Home
              </Link>
              <Link to="/portal" className="btn btn-ghost">
                Portal
              </Link>
            </motion.div>
          </div>
        </motion.div>

        {feedback ? (
          <div className="editor-feedback editor-feedback-success mb-5">
            {feedback}
          </div>
        ) : null}

        {error ? (
          <div className="editor-feedback editor-feedback-error mb-5">
            {error}
          </div>
        ) : null}

        <div className="mb-6 rounded-2xl border border-[rgba(94,207,207,0.16)] bg-[rgba(94,207,207,0.07)] p-4 text-sm text-white/75">
          Current mode: simulated checkout. No real payment is collected. The database still stores
          the order, generated QR code, scratch code, and assigned buyer email so the real payment
          layer can be added later.
        </div>

        {loading ? (
          <motion.div
            className="surface-card p-8"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35 }}
          >
            <div className="eyebrow mb-4">Shop</div>
            <h2 className="display mb-3 text-3xl font-bold">Loading products...</h2>
            <p className="muted">Preparing the simulated shop catalog.</p>
          </motion.div>
        ) : null}

        {!loading && products.length === 0 ? (
          <motion.div
            className="surface-card p-8"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35 }}
          >
            <div className="eyebrow mb-4">Shop</div>
            <h2 className="display mb-3 text-3xl font-bold">No active products</h2>
            <p className="muted">Add active shop products in the database to test checkout.</p>
          </motion.div>
        ) : null}

        {!loading && products.length > 0 ? (
          <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
            <motion.div
              className="grid gap-5 md:grid-cols-2"
              variants={stagger}
              initial="hidden"
              animate="visible"
            >
              {products.map((product) => {
                const selected = product.id === selectedProductId

                return (
                  <motion.button
                    key={product.id}
                    type="button"
                    onClick={() => handleSelectProduct(product.id)}
                    className={`surface-card relative overflow-hidden p-6 text-left transition ${
                      selected
                        ? 'border-[rgba(94,207,207,0.38)] bg-[rgba(94,207,207,0.08)]'
                        : ''
                    }`}
                    variants={fadeUp}
                    transition={{ duration: 0.35 }}
                  >
                    <div className="editor-card-glow" />

                    <div className="mb-5 flex items-start justify-between gap-4">
                      <div>
                        <div className="eyebrow mb-2">{formatCategory(product.category)}</div>
                        <h2 className="display text-2xl font-bold">{product.name}</h2>
                      </div>

                      <div className="rounded-full border border-[rgba(94,207,207,0.18)] bg-[rgba(255,255,255,0.04)] px-3 py-1 text-sm text-[#5ECFCF]">
                        {product.qr_quantity} QR
                      </div>
                    </div>

                    <p className="muted mb-6 min-h-[72px]">
                      {product.description || 'QR-linked product for buyer-bound activation.'}
                    </p>

                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <div className="text-sm text-white/45">Price</div>
                        <div className="text-2xl font-bold text-[#5ECFCF]">
                          {formatShopPrice(product.price_cents, product.currency)}
                        </div>
                      </div>

                      <div className="rounded-full border border-[rgba(255,255,255,0.12)] px-4 py-2 text-sm text-white/70">
                        {product.code_type === 'locked' ? 'Template locked' : 'Open code'}
                      </div>
                    </div>
                  </motion.button>
                )
              })}
            </motion.div>

            <motion.div
              className="surface-card h-fit p-6"
              variants={fadeUp}
              initial="hidden"
              animate="visible"
              transition={{ duration: 0.4 }}
            >
              <div className="mb-6">
                <div className="eyebrow mb-3">Checkout simulation</div>
                <h2 className="display text-2xl font-bold">Create buyer-bound QR</h2>
                <p className="muted mt-2">
                  The buyer email will be attached to the generated QR code. Activation must match
                  that email.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="grid gap-4">
                <div>
                  <label className="mb-2 block text-sm font-medium">Selected Product</label>
                  <select
                    className="field"
                    value={selectedProductId}
                    onChange={(e) => handleSelectProduct(e.target.value)}
                  >
                    {products.map((product) => (
                      <option key={product.id} value={product.id}>
                        {product.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Buyer Name</label>
                  <input
                    className="field"
                    type="text"
                    value={buyerName}
                    maxLength={120}
                    onChange={(e) => setBuyerName(e.target.value)}
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Buyer Email</label>
                  <input
                    className="field"
                    type="email"
                    value={buyerEmail}
                    maxLength={254}
                    onChange={(e) => setBuyerEmail(e.target.value)}
                    placeholder="buyer@example.com"
                    required
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Quantity</label>
                  <input
                    className="field"
                    type="number"
                    min={1}
                    max={10}
                    value={quantity}
                    onChange={(e) => setQuantity(Number(e.target.value || 1))}
                  />
                </div>

                <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <div className="text-sm text-white/45">Simulated total</div>
                      <div className="text-2xl font-bold text-[#5ECFCF]">{totalPrice}</div>
                    </div>

                    <div className="text-right text-sm text-white/60">
                      No payment collected
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-primary glow-btn w-full"
                  disabled={submitting}
                >
                  {submitting ? 'Creating order...' : 'Create Simulated Order'}
                </button>
              </form>
            </motion.div>
          </div>
        ) : null}

        {orderResult ? (
          <motion.div
            className="surface-card mt-6 p-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35 }}
          >
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="eyebrow mb-3">Order created</div>
                <h2 className="display text-3xl font-bold">
                  {orderResult.order?.order_number}
                </h2>
                <p className="muted mt-2">
                  Assigned to {orderResult.order?.buyer_email}. Keep the scratch code for testing
                  activation.
                </p>
              </div>

              <div className="rounded-[18px] border border-[rgba(94,207,207,0.14)] bg-[rgba(94,207,207,0.08)] p-4 text-sm text-white/75">
                Status: {orderResult.order?.status}
                <br />
                Payment: {orderResult.order?.payment_status}
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {(orderResult.qr_codes || []).map((qr) => {
                const activationUrl = getActivationUrl(qr.code)
                const publicUrl = getPublicUrl(qr.code)

                return (
                  <div
                    key={qr.id}
                    className="rounded-[20px] border border-[rgba(94,207,207,0.14)] bg-[rgba(255,255,255,0.025)] p-5"
                  >
                    <div className="mb-4">
                      <div className="text-sm uppercase tracking-[0.14em] text-[#5ECFCF]">
                        Generated QR Code
                      </div>
                      <div className="mt-2 break-all text-xl font-bold">{qr.code}</div>
                    </div>

                    <div className="grid gap-3 text-sm">
                      <div className="rounded-[14px] bg-black/20 p-3">
                        <div className="text-white/45">Scratch Code</div>
                        <div className="mt-1 font-mono text-lg text-white">
                          {qr.scratch_code}
                        </div>
                      </div>

                      <div className="rounded-[14px] bg-black/20 p-3">
                        <div className="text-white/45">Assigned Email</div>
                        <div className="mt-1 break-all text-white">{qr.assigned_email}</div>
                      </div>

                      <div className="rounded-[14px] bg-black/20 p-3">
                        <div className="text-white/45">Activation URL</div>
                        <div className="mt-1 break-all text-white">{activationUrl}</div>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Link to={`/activate/${qr.code}`} className="btn btn-primary">
                        Test Activation
                      </Link>
                      <Link to={`/p/${qr.code}`} className="btn btn-secondary">
                        Public Page
                      </Link>
                      <button
                        type="button"
                        className="btn btn-ghost"
                        onClick={() => copyText(`${activationUrl}\nScratch: ${qr.scratch_code}`)}
                      >
                        Copy
                      </button>
                    </div>

                    <div className="mt-4 break-all text-xs text-white/45">
                      Public URL after activation: {publicUrl}
                    </div>
                  </div>
                )
              })}
            </div>
          </motion.div>
        ) : null}
      </div>
    </div>
  )
}
