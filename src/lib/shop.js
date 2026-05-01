import { supabase } from './supabase'

const LIMITS = {
  email: 254,
  buyerName: 120,
  quantityMin: 1,
  quantityMax: 10,
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// Client-side UUID shape check only.
// Postgres/RPC remains the source of truth for real UUID validation.
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function makeError(message, extra = {}) {
  return {
    message,
    ...extra,
  }
}

function sanitizeControlChars(value) {
  return String(value || '').replace(/[\u0000-\u001F\u007F]/g, '')
}

function sanitizeSingleLineText(value, maxLength) {
  return sanitizeControlChars(value)
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function normalizeEmail(value) {
  return sanitizeSingleLineText(value, LIMITS.email).toLowerCase()
}

function sanitizeQuantity(value) {
  const number = Number(value)

  if (!Number.isInteger(number)) {
    return 1
  }

  return Math.max(LIMITS.quantityMin, Math.min(LIMITS.quantityMax, number))
}

function validateProductId(productId) {
  const safeProductId = String(productId || '').trim()

  if (!safeProductId) {
    return {
      value: '',
      error: 'Product is required.',
    }
  }

  if (!UUID_PATTERN.test(safeProductId)) {
    return {
      value: '',
      error: 'Invalid product ID.',
    }
  }

  return {
    value: safeProductId,
    error: '',
  }
}

function validateBuyerEmail(email) {
  const normalizedEmail = normalizeEmail(email)

  if (!normalizedEmail) {
    return {
      value: '',
      error: 'Buyer email is required.',
    }
  }

  if (!EMAIL_PATTERN.test(normalizedEmail)) {
    return {
      value: '',
      error: 'Buyer email must be valid.',
    }
  }

  return {
    value: normalizedEmail,
    error: '',
  }
}

export function formatShopPrice(priceCents, currency = 'EUR') {
  const safeAmount = Number(priceCents || 0) / 100
  const safeCurrency = String(currency || 'EUR').toUpperCase()

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: safeCurrency,
    }).format(safeAmount)
  } catch {
    return `${safeAmount.toFixed(2)} ${safeCurrency}`
  }
}

export async function getShopProducts() {
  const { data, error } = await supabase
    .from('shop_products')
    .select(
      [
        'id',
        'slug',
        'name',
        'category',
        'description',
        'image_url',
        'price_cents',
        'currency',
        'code_type',
        'qr_quantity',
        'is_active',
        'sort_order',
      ].join(','),
    )
    .eq('is_active', true)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  if (error) {
    return {
      data: [],
      error,
    }
  }

  return {
    data: Array.isArray(data) ? data : [],
    error: null,
  }
}

export async function createSimulatedShopOrder({
  productId,
  buyerEmail,
  quantity = 1,
  buyerName = '',
}) {
  const { value: safeProductId, error: productError } = validateProductId(productId)

  if (productError) {
    return {
      data: null,
      error: makeError(productError),
    }
  }

  const { value: safeBuyerEmail, error: emailError } = validateBuyerEmail(buyerEmail)

  if (emailError) {
    return {
      data: null,
      error: makeError(emailError),
    }
  }

  const safeQuantity = sanitizeQuantity(quantity)
  const safeBuyerName = sanitizeSingleLineText(buyerName, LIMITS.buyerName)

  const { data, error } = await supabase.rpc('create_simulated_shop_order', {
    p_product_id: safeProductId,
    p_buyer_email: safeBuyerEmail,
    p_quantity: safeQuantity,
    p_buyer_name: safeBuyerName || null,
  })

  if (error) {
    return {
      data: null,
      error,
    }
  }

  if (!data?.success) {
    return {
      data: null,
      error: makeError(data?.message || 'Could not create simulated order.', {
        status: data?.status,
        retryAfterSeconds: data?.retryAfterSeconds,
      }),
    }
  }

  return {
    data,
    error: null,
  }
}
