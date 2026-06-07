import { supabase } from './supabase'
import { defaultPageData } from './pageBuilder'

const LIMITS = {
  email: 254,
  name: 120,
  label: 160,
  prefix: 12,
  code: 80,
  scratchCode: 14,
  accentColor: 20,
  articleTitle: 180,
  articleExcerpt: 500,
  articleBody: 20000,
  articleTag: 80,
  articleDate: 40,
  articleReadTime: 80,
  shopProductName: 160,
  shopProductSlug: 140,
  shopProductCategory: 40,
  shopProductDescription: 1200,
  shopProductCurrency: 3,
  url: 2048,
  pageDataJson: 250000,
  bulkQrCount: 500,
  adminSearch: 180,
  adminPageSize: 100,
  adminExportPageSize: 1000,
}

const CONTROL_CHARS_PATTERN = new RegExp('[\\x00-\\x1F\\x7F]', 'g')
const MULTILINE_CONTROL_CHARS_PATTERN = new RegExp(
  '[\\x00-\\x08\\x0B\\x0C\\x0E-\\x1F\\x7F]',
  'g',
)

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const QR_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/
const SCRATCH_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/
const HEX_COLOR_PATTERN = /^#([0-9A-Fa-f]{6})$/
const SAFE_SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/
const CURRENCY_PATTERN = /^[A-Z]{3}$/

const VALID_CODE_TYPES = new Set(['open', 'locked'])
const VALID_SHOP_CATEGORIES = new Set([
  'qr_product',
  'collectible',
  'wearable',
  'accessory',
  'digital',
])

const PROFILE_UPDATE_FIELDS = new Set([
  'full_name',
  'bio',
  'avatar_url',
  'website',
  'location',
  'company',
  'organization',
  'title',
  'username',
  'accent_color',
])

const TEMPLATE_UPDATE_FIELDS = new Set(['name', 'page_data'])

const QR_UPDATE_FIELDS = new Set([
  'code',
  'scratch_code',
  'label',
  'code_type',
  'template_id',
  'assigned_email',
  'assigned_to',
  'activated',
  'is_active',
])

const ARTICLE_FIELDS = new Set([
  'author_id',
  'title',
  'tag',
  'excerpt',
  'content',
  'date',
  'read_time',
  'published',
])

const SHOP_PRODUCT_FIELDS = new Set([
  'slug',
  'name',
  'category',
  'description',
  'image_url',
  'price_cents',
  'currency',
  'code_type',
  'template_id',
  'qr_quantity',
  'is_active',
  'sort_order',
])

const FILTER_OPTIONS_ADMIN_QR = new Set([
  'all',
  'pending',
  'redeemed',
  'open',
  'locked',
  'templated',
  'batched',
])

const SORT_OPTIONS_ADMIN_QR = new Set([
  'created_desc',
  'created_asc',
  'label_asc',
  'label_desc',
  'code_asc',
  'code_desc',
])

function makeError(message) {
  return new Error(message)
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function rejectUnexpectedFields(payload, allowedFields, label = 'payload') {
  if (!isPlainObject(payload)) {
    return `${label} must be an object.`
  }

  const unexpected = Object.keys(payload).filter((key) => !allowedFields.has(key))

  if (unexpected.length) {
    return `Unexpected field${unexpected.length > 1 ? 's' : ''}: ${unexpected.join(', ')}.`
  }

  return ''
}

function sanitizeControlChars(value) {
  return String(value || '').replace(CONTROL_CHARS_PATTERN, '')
}

function sanitizeLiveText(value, maxLength) {
  return sanitizeControlChars(value).replace(/[<>]/g, '').slice(0, maxLength)
}

function sanitizeSingleLineText(value, maxLength) {
  return sanitizeLiveText(value, maxLength).replace(/\s+/g, ' ').trim()
}

function sanitizeMultilineText(value, maxLength) {
  return String(value || '')
    .replace(MULTILINE_CONTROL_CHARS_PATTERN, '')
    .replace(/[<>]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{8,}/g, '\n\n\n\n\n\n\n')
    .slice(0, maxLength)
}

function sanitizeUrl(value) {
  return sanitizeControlChars(value).replace(/[<>]/g, '').trim().slice(0, LIMITS.url)
}

function hasUnsafeProtocol(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return /^(javascript|data|vbscript):/.test(normalized)
}

function sanitizeHexColor(value, fallback = '#5ECFCF') {
  const safeValue = sanitizeSingleLineText(value, LIMITS.accentColor)

  if (!safeValue) {
    return { value: fallback, error: '' }
  }

  if (!HEX_COLOR_PATTERN.test(safeValue)) {
    return { value: fallback, error: 'Accent color must be a valid hex color like #5ECFCF.' }
  }

  return { value: safeValue, error: '' }
}

function sanitizeSlug(value, fieldName = 'Slug') {
  const safeValue = sanitizeSingleLineText(value, LIMITS.shopProductSlug).toLowerCase()

  if (!safeValue) {
    return { value: '', error: `${fieldName} is required.` }
  }

  if (!SAFE_SLUG_PATTERN.test(safeValue)) {
    return {
      value: '',
      error: `${fieldName} can contain lowercase letters, numbers, and hyphens only.`,
    }
  }

  return { value: safeValue, error: '' }
}

function sanitizeNullableUuid(value, fieldName) {
  if (value === null || value === undefined || value === '') {
    return { value: null, error: '' }
  }

  const safeValue = String(value).trim()

  if (!UUID_PATTERN.test(safeValue)) {
    return { value: null, error: `${fieldName} must be a valid UUID.` }
  }

  return { value: safeValue, error: '' }
}

function sanitizeRequiredUuid(value, fieldName) {
  const safeValue = String(value || '').trim()

  if (!safeValue) {
    return { value: '', error: `${fieldName} is required.` }
  }

  if (!UUID_PATTERN.test(safeValue)) {
    return { value: '', error: `${fieldName} must be a valid UUID.` }
  }

  return { value: safeValue, error: '' }
}

function createUuid() {
  const cryptoApi = typeof crypto !== 'undefined' ? crypto : null

  if (cryptoApi?.randomUUID) {
    return cryptoApi.randomUUID()
  }

  if (cryptoApi?.getRandomValues) {
    const bytes = new Uint8Array(16)
    cryptoApi.getRandomValues(bytes)

    bytes[6] = (bytes[6] & 0x0f) | 0x40
    bytes[8] = (bytes[8] & 0x3f) | 0x80

    const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join('-')
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16)
    const value = char === 'x' ? random : (random & 0x3) | 0x8
    return value.toString(16)
  })
}

export function normalizeAssignedEmail(email) {
  const normalized = String(email || '').trim().toLowerCase().slice(0, LIMITS.email)
  return normalized || null
}

function clampAdminPage(value) {
  const page = Number(value)
  if (!Number.isInteger(page) || page < 1) return 1
  return Math.min(page, 100000)
}

function clampAdminPageSize(value, fallback = 20) {
  const pageSize = Number(value)
  if (!Number.isInteger(pageSize)) return fallback
  return Math.max(1, Math.min(LIMITS.adminPageSize, pageSize))
}

function sanitizeAdminSearch(value) {
  return sanitizeSingleLineText(value, LIMITS.adminSearch)
    .replace(/[^A-Za-z0-9_-]/g, '')
    .trim()
}

function applyAdminQrFilters(query, { search = '', filter = 'all' } = {}) {
  const safeSearch = sanitizeAdminSearch(search)
  const safeFilter = FILTER_OPTIONS_ADMIN_QR.has(filter) ? filter : 'all'

  let nextQuery = query

  if (safeSearch) {
    nextQuery = nextQuery.ilike('code', `%${safeSearch}%`)
  }

  if (safeFilter === 'pending') nextQuery = nextQuery.eq('activated', false)
  if (safeFilter === 'redeemed') nextQuery = nextQuery.eq('activated', true)
  if (safeFilter === 'open') nextQuery = nextQuery.eq('code_type', 'open')
  if (safeFilter === 'locked') nextQuery = nextQuery.eq('code_type', 'locked')
  if (safeFilter === 'templated') nextQuery = nextQuery.not('template_id', 'is', null)
  if (safeFilter === 'batched') nextQuery = nextQuery.not('bulk_batch_id', 'is', null)

  return nextQuery
}

function applyAdminQrSort(query, sortBy = 'created_desc') {
  const safeSortBy = SORT_OPTIONS_ADMIN_QR.has(sortBy) ? sortBy : 'created_desc'

  if (safeSortBy === 'created_asc') {
    return query.order('created_at', { ascending: true })
  }

  if (safeSortBy === 'label_asc') {
    return query
      .order('label', { ascending: true, nullsFirst: false })
      .order('created_at', { ascending: false })
  }

  if (safeSortBy === 'label_desc') {
    return query
      .order('label', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false })
  }

  if (safeSortBy === 'code_asc') {
    return query.order('code', { ascending: true }).order('created_at', { ascending: false })
  }

  if (safeSortBy === 'code_desc') {
    return query.order('code', { ascending: false }).order('created_at', { ascending: false })
  }

  return query.order('created_at', { ascending: false })
}

function validateAssignedEmail(email, fieldName = 'Email') {
  const normalized = normalizeAssignedEmail(email)

  if (!normalized) {
    return { value: null, error: '' }
  }

  if (!EMAIL_PATTERN.test(normalized)) {
    return { value: null, error: `${fieldName} must be a valid email address.` }
  }

  return { value: normalized, error: '' }
}

function sanitizeCodeType(codeType) {
  const normalized = String(codeType || '').trim().toLowerCase()

  if (!VALID_CODE_TYPES.has(normalized)) {
    return { value: '', error: 'Code type must be open or locked.' }
  }

  return { value: normalized, error: '' }
}

function sanitizeShopCategory(category) {
  const normalized = String(category || '').trim().toLowerCase()

  if (!VALID_SHOP_CATEGORIES.has(normalized)) {
    return {
      value: '',
      error: 'Shop category must be qr_product, collectible, wearable, accessory, or digital.',
    }
  }

  return { value: normalized, error: '' }
}

function sanitizeCurrency(currency) {
  const normalized = sanitizeSingleLineText(
    currency || 'EUR',
    LIMITS.shopProductCurrency,
  ).toUpperCase()

  if (!CURRENCY_PATTERN.test(normalized)) {
    return { value: '', error: 'Currency must be a valid 3-letter code like EUR or USD.' }
  }

  return { value: normalized, error: '' }
}

function normalizeCode(code) {
  return String(code || '').trim().toUpperCase()
}

function normalizeScratchCode(scratchCode) {
  return String(scratchCode || '').trim().toUpperCase()
}

function validateQrCode(code) {
  const normalized = normalizeCode(code)

  if (!normalized) {
    return { value: '', error: 'Public code is required.' }
  }

  if (!QR_CODE_PATTERN.test(normalized)) {
    return { value: '', error: 'Invalid public code format.' }
  }

  return { value: normalized, error: '' }
}

function validateScratchCode(scratchCode) {
  const normalized = normalizeScratchCode(scratchCode)

  if (!normalized) {
    return { value: '', error: 'Scratch code is required.' }
  }

  if (!SCRATCH_CODE_PATTERN.test(normalized)) {
    return { value: '', error: 'Invalid scratch code format. Use XXXX-XXXX-XXXX.' }
  }

  return { value: normalized, error: '' }
}

function sanitizeBoolean(value, fallback = false) {
  if (typeof value === 'boolean') return value
  return fallback
}

function sanitizeInteger(value, min, max, fallback) {
  const number = Number(value)

  if (!Number.isInteger(number)) {
    return fallback
  }

  return Math.max(min, Math.min(max, number))
}

function validatePageData(pageData) {
  if (!isPlainObject(pageData)) {
    return { value: defaultPageData, error: 'Page data must be an object.' }
  }

  let json = ''

  try {
    json = JSON.stringify(pageData)
  } catch {
    return { value: defaultPageData, error: 'Page data must be valid JSON.' }
  }

  if (json.length > LIMITS.pageDataJson) {
    return {
      value: defaultPageData,
      error: `Page data is too large. Maximum size is ${LIMITS.pageDataJson} characters.`,
    }
  }

  return { value: pageData, error: '' }
}

function sanitizeProfileUpdates(updates) {
  const unexpectedError = rejectUnexpectedFields(updates, PROFILE_UPDATE_FIELDS, 'Profile updates')
  if (unexpectedError) return { payload: null, error: unexpectedError }

  const payload = {}

  if (Object.prototype.hasOwnProperty.call(updates, 'full_name')) {
    payload.full_name = sanitizeSingleLineText(updates.full_name, LIMITS.name)
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'bio')) {
    payload.bio = sanitizeMultilineText(updates.bio, 1000)
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'avatar_url')) {
    const avatarUrl = sanitizeUrl(updates.avatar_url)

    if (hasUnsafeProtocol(avatarUrl)) {
      return { payload: null, error: 'Avatar URL uses an unsafe protocol.' }
    }

    payload.avatar_url = avatarUrl || null
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'website')) {
    const website = sanitizeUrl(updates.website)

    if (hasUnsafeProtocol(website)) {
      return { payload: null, error: 'Website URL uses an unsafe protocol.' }
    }

    payload.website = website || null
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'accent_color')) {
    const { value, error } = sanitizeHexColor(updates.accent_color)

    if (error) return { payload: null, error }

    payload.accent_color = value
  }

  for (const field of ['location', 'company', 'organization', 'title', 'username']) {
    if (Object.prototype.hasOwnProperty.call(updates, field)) {
      payload[field] = sanitizeSingleLineText(updates[field], LIMITS.name) || null
    }
  }

  return { payload, error: '' }
}

function sanitizeTemplateUpdates(updates) {
  const unexpectedError = rejectUnexpectedFields(updates, TEMPLATE_UPDATE_FIELDS, 'Template updates')
  if (unexpectedError) return { payload: null, error: unexpectedError }

  const payload = {}

  if (Object.prototype.hasOwnProperty.call(updates, 'name')) {
    const name = sanitizeSingleLineText(updates.name, LIMITS.name)

    if (name.length < 2) {
      return { payload: null, error: 'Template name must be at least 2 characters.' }
    }

    payload.name = name
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'page_data')) {
    const { value, error } = validatePageData(updates.page_data)

    if (error) return { payload: null, error }

    payload.page_data = value
  }

  return { payload, error: '' }
}

function sanitizeQrUpdates(updates) {
  const unexpectedError = rejectUnexpectedFields(updates, QR_UPDATE_FIELDS, 'QR updates')
  if (unexpectedError) return { payload: null, error: unexpectedError }

  const payload = {}

  if (Object.prototype.hasOwnProperty.call(updates, 'code')) {
    const { value, error } = validateQrCode(updates.code)

    if (error) return { payload: null, error }

    payload.code = value
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'scratch_code')) {
    const { value, error } = validateScratchCode(updates.scratch_code)

    if (error) return { payload: null, error }

    payload.scratch_code = value
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'label')) {
    payload.label = sanitizeSingleLineText(updates.label, LIMITS.label) || null
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'code_type')) {
    const { value, error } = sanitizeCodeType(updates.code_type)

    if (error) return { payload: null, error }

    payload.code_type = value
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'template_id')) {
    const { value, error } = sanitizeNullableUuid(updates.template_id, 'Template ID')

    if (error) return { payload: null, error }

    payload.template_id = value
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'assigned_email')) {
    const { value, error } = validateAssignedEmail(updates.assigned_email, 'Assigned email')

    if (error) return { payload: null, error }

    payload.assigned_email = value
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'assigned_to')) {
    const { value, error } = sanitizeNullableUuid(updates.assigned_to, 'Assigned user ID')

    if (error) return { payload: null, error }

    payload.assigned_to = value
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'activated')) {
    payload.activated = sanitizeBoolean(updates.activated, false)
  }

  if (Object.prototype.hasOwnProperty.call(updates, 'is_active')) {
    payload.is_active = sanitizeBoolean(updates.is_active, true)
  }

  if (payload.code_type === 'open') {
    payload.template_id = null
  }

  return { payload, error: '' }
}

function sanitizeArticlePayload(input, { partial = false } = {}) {
  const unexpectedError = rejectUnexpectedFields(input, ARTICLE_FIELDS, 'Article payload')
  if (unexpectedError) return { payload: null, error: unexpectedError }

  const payload = {}

  if (Object.prototype.hasOwnProperty.call(input, 'title')) {
    const title = sanitizeSingleLineText(input.title, LIMITS.articleTitle)

    if (!partial && title.length < 2) {
      return { payload: null, error: 'Article title must be at least 2 characters.' }
    }

    payload.title = title
  }

  if (Object.prototype.hasOwnProperty.call(input, 'tag')) {
    payload.tag = sanitizeSingleLineText(input.tag, LIMITS.articleTag) || null
  }

  if (Object.prototype.hasOwnProperty.call(input, 'excerpt')) {
    payload.excerpt = sanitizeMultilineText(input.excerpt, LIMITS.articleExcerpt)
  }

  if (Object.prototype.hasOwnProperty.call(input, 'content')) {
    payload.content = sanitizeMultilineText(input.content, LIMITS.articleBody)
  }

  if (Object.prototype.hasOwnProperty.call(input, 'date')) {
    payload.date = sanitizeSingleLineText(input.date, LIMITS.articleDate) || null
  }

  if (Object.prototype.hasOwnProperty.call(input, 'read_time')) {
    payload.read_time = sanitizeSingleLineText(input.read_time, LIMITS.articleReadTime) || null
  }

  if (Object.prototype.hasOwnProperty.call(input, 'published')) {
    payload.published = sanitizeBoolean(input.published, false)
  }

  if (Object.prototype.hasOwnProperty.call(input, 'author_id')) {
    const { value, error } = sanitizeRequiredUuid(input.author_id, 'Author ID')

    if (error) return { payload: null, error }

    payload.author_id = value
  }

  return { payload, error: '' }
}

function sanitizeShopProductPayload(input, { partial = false } = {}) {
  const unexpectedError = rejectUnexpectedFields(input, SHOP_PRODUCT_FIELDS, 'Shop product payload')
  if (unexpectedError) return { payload: null, error: unexpectedError }

  const payload = {}

  if (Object.prototype.hasOwnProperty.call(input, 'slug')) {
    const { value, error } = sanitizeSlug(input.slug, 'Product slug')

    if (error) return { payload: null, error }

    payload.slug = value
  } else if (!partial) {
    return { payload: null, error: 'Product slug is required.' }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'name')) {
    const name = sanitizeSingleLineText(input.name, LIMITS.shopProductName)

    if (name.length < 2) {
      return { payload: null, error: 'Product name must be at least 2 characters.' }
    }

    payload.name = name
  } else if (!partial) {
    return { payload: null, error: 'Product name is required.' }
  }

  if (Object.prototype.hasOwnProperty.call(input, 'category')) {
    const { value, error } = sanitizeShopCategory(input.category)

    if (error) return { payload: null, error }

    payload.category = value
  } else if (!partial) {
    payload.category = 'qr_product'
  }

  if (Object.prototype.hasOwnProperty.call(input, 'description')) {
    payload.description = sanitizeMultilineText(
      input.description,
      LIMITS.shopProductDescription,
    ) || null
  }

  if (Object.prototype.hasOwnProperty.call(input, 'image_url')) {
    const imageUrl = sanitizeUrl(input.image_url)

    if (hasUnsafeProtocol(imageUrl)) {
      return { payload: null, error: 'Product image URL uses an unsafe protocol.' }
    }

    payload.image_url = imageUrl || null
  }

  if (Object.prototype.hasOwnProperty.call(input, 'price_cents')) {
    payload.price_cents = sanitizeInteger(input.price_cents, 0, 10000000, 0)
  } else if (!partial) {
    payload.price_cents = 0
  }

  if (Object.prototype.hasOwnProperty.call(input, 'currency')) {
    const { value, error } = sanitizeCurrency(input.currency)

    if (error) return { payload: null, error }

    payload.currency = value
  } else if (!partial) {
    payload.currency = 'EUR'
  }

  if (Object.prototype.hasOwnProperty.call(input, 'code_type')) {
    const { value, error } = sanitizeCodeType(input.code_type)

    if (error) return { payload: null, error }

    payload.code_type = value
  } else if (!partial) {
    payload.code_type = 'open'
  }

  if (Object.prototype.hasOwnProperty.call(input, 'template_id')) {
    const { value, error } = sanitizeNullableUuid(input.template_id, 'Template ID')

    if (error) return { payload: null, error }

    payload.template_id = value
  }

  if (Object.prototype.hasOwnProperty.call(input, 'qr_quantity')) {
    payload.qr_quantity = sanitizeInteger(input.qr_quantity, 1, 20, 1)
  } else if (!partial) {
    payload.qr_quantity = 1
  }

  if (Object.prototype.hasOwnProperty.call(input, 'is_active')) {
    payload.is_active = sanitizeBoolean(input.is_active, true)
  } else if (!partial) {
    payload.is_active = true
  }

  if (Object.prototype.hasOwnProperty.call(input, 'sort_order')) {
    payload.sort_order = sanitizeInteger(input.sort_order, 0, 100000, 0)
  } else if (!partial) {
    payload.sort_order = 0
  }

  if (payload.code_type === 'open') {
    payload.template_id = null
  }

  if (!partial && payload.code_type === 'locked' && !payload.template_id) {
    return { payload: null, error: 'Locked shop products must have a template assigned.' }
  }

  if (
    partial &&
    payload.code_type === 'locked' &&
    Object.prototype.hasOwnProperty.call(input, 'template_id') &&
    !payload.template_id
  ) {
    return { payload: null, error: 'Locked shop products must have a template assigned.' }
  }

  return { payload, error: '' }
}

export async function getMyQrCodes(userId, email = '') {
  if (!userId) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase.rpc('get_my_qr_codes')

  if (error) {
    return { data: null, error }
  }

  const rows = Array.isArray(data) ? data : []

  const sorted = rows.sort(
    (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
  )

  return { data: sorted, error: null }
}

export async function getScanCountForUserCodes(userId) {
  if (!userId) {
    return { count: 0, error: null }
  }

  const { data, error } = await supabase.rpc('get_my_scan_count')

  if (error) {
    return { count: 0, error }
  }

  return { count: Number(data) || 0, error: null }
}

export async function getRecentScansForUserCodes(userId, limit = 20) {
  if (!userId) {
    return { data: [], error: null }
  }

  const safeLimit = Math.max(1, Math.min(100, Number(limit) || 20))

  const { data, error } = await supabase.rpc('get_my_recent_scans', {
    p_limit: safeLimit,
  })

  if (error) {
    return { data: [], error }
  }

  return {
    data: Array.isArray(data) ? data : [],
    error: null,
  }
}

export async function getScanBreakdownForUserCodes(userId) {
  if (!userId) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase.rpc('get_my_scan_breakdown')

  if (error) {
    return { data: [], error }
  }

  return {
    data: Array.isArray(data) ? data : [],
    error: null,
  }
}

export async function updateMyProfile(userId, updates) {
  const { value: safeUserId, error: userIdError } = sanitizeRequiredUuid(userId, 'User ID')
  if (userIdError) return { data: null, error: makeError(userIdError) }

  const { payload, error: validationError } = sanitizeProfileUpdates(updates)
  if (validationError) return { data: null, error: makeError(validationError) }

  const { data, error } = await supabase
    .from('profiles')
    .update(payload)
    .eq('id', safeUserId)
    .select()
    .single()

  return { data, error }
}

export async function getAllQrCodes(options = {}) {
  const page = clampAdminPage(options.page)
  const pageSize = clampAdminPageSize(options.pageSize, 20)
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1

  let query = supabase.from('qr_codes').select('*', { count: 'exact' })
  query = applyAdminQrFilters(query, options)
  query = applyAdminQrSort(query, options.sortBy)

  const { data, error, count } = await query.range(from, to)

  return {
    data,
    error,
    count: Number(count) || 0,
    page,
    pageSize,
  }
}

export async function getAllQrCodesForExport(options = {}) {
  const pageSize = LIMITS.adminExportPageSize
  let from = 0
  let rows = []

  while (true) {
    let query = supabase.from('qr_codes').select('*')
    query = applyAdminQrFilters(query, options)
    query = applyAdminQrSort(query, options.sortBy)

    const { data, error } = await query.range(from, from + pageSize - 1)

    if (error) {
      return { data: null, error, count: rows.length }
    }

    const chunk = Array.isArray(data) ? data : []
    rows = rows.concat(chunk)

    if (chunk.length < pageSize) {
      break
    }

    from += pageSize
  }

  return {
    data: rows,
    error: null,
    count: rows.length,
  }
}

export async function getAdminQrCodeCounts() {
  const [all, pending, redeemed, batched] = await Promise.all([
    supabase.from('qr_codes').select('id', { count: 'exact', head: true }),
    supabase
      .from('qr_codes')
      .select('id', { count: 'exact', head: true })
      .eq('activated', false),
    supabase
      .from('qr_codes')
      .select('id', { count: 'exact', head: true })
      .eq('activated', true),
    supabase
      .from('qr_codes')
      .select('id', { count: 'exact', head: true })
      .not('bulk_batch_id', 'is', null),
  ])

  const firstError = all.error || pending.error || redeemed.error || batched.error

  if (firstError) {
    return { data: null, error: firstError }
  }

  return {
    data: {
      all: Number(all.count) || 0,
      pending: Number(pending.count) || 0,
      redeemed: Number(redeemed.count) || 0,
      batched: Number(batched.count) || 0,
    },
    error: null,
  }
}

export async function getMyArticles(userId, isAdmin = false) {
  let query = supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    const { value: safeUserId, error: userIdError } = sanitizeRequiredUuid(
      userId,
      'User ID',
    )

    if (userIdError) {
      return { data: [], error: makeError(userIdError) }
    }

    query = query.eq('author_id', safeUserId)
  }

  const { data, error } = await query
  return { data, error }
}

export async function getAllTemplates() {
  const { data, error } = await supabase
    .from('content_templates')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function createTemplate(name, userId) {
  const safeName = sanitizeSingleLineText(name, LIMITS.name)

  if (safeName.length < 2) {
    return { data: null, error: makeError('Template name must be at least 2 characters.') }
  }

  const { value: safeUserId, error: userIdError } = sanitizeRequiredUuid(
    userId,
    'User ID',
  )
  if (userIdError) return { data: null, error: makeError(userIdError) }

  const { data, error } = await supabase
    .from('content_templates')
    .insert({
      name: safeName,
      created_by: safeUserId,
      page_data: defaultPageData,
    })
    .select()
    .single()

  return { data, error }
}

export async function updateTemplate(templateId, updates) {
  const { value: safeTemplateId, error: templateIdError } = sanitizeRequiredUuid(
    templateId,
    'Template ID',
  )
  if (templateIdError) return { data: null, error: makeError(templateIdError) }

  const { payload, error: validationError } = sanitizeTemplateUpdates(updates)
  if (validationError) return { data: null, error: makeError(validationError) }

  const { data, error } = await supabase
    .from('content_templates')
    .update(payload)
    .eq('id', safeTemplateId)
    .select()
    .single()

  return { data, error }
}

export async function getAllShopProducts() {
  const { data, error } = await supabase
    .from('shop_products')
    .select('*')
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function createShopProduct(input) {
  const { payload, error: validationError } = sanitizeShopProductPayload(input)

  if (validationError) {
    return { data: null, error: makeError(validationError) }
  }

  const { data, error } = await supabase
    .from('shop_products')
    .insert(payload)
    .select()
    .single()

  return { data, error }
}

export async function updateShopProduct(productId, updates) {
  const { value: safeProductId, error: productIdError } = sanitizeRequiredUuid(
    productId,
    'Shop product ID',
  )
  if (productIdError) return { data: null, error: makeError(productIdError) }

  const { payload, error: validationError } = sanitizeShopProductPayload(updates, {
    partial: true,
  })
  if (validationError) return { data: null, error: makeError(validationError) }

  if (Object.keys(payload).length === 0) {
    return { data: null, error: makeError('No valid shop product updates were provided.') }
  }

  const { data, error } = await supabase
    .from('shop_products')
    .update(payload)
    .eq('id', safeProductId)
    .select()
    .single()

  return { data, error }
}

export async function deleteShopProduct(productId) {
  const { value: safeProductId, error: productIdError } = sanitizeRequiredUuid(
    productId,
    'Shop product ID',
  )
  if (productIdError) return { error: makeError(productIdError) }

  const { error } = await supabase.from('shop_products').delete().eq('id', safeProductId)

  return { error }
}

function randomChunk(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''

  const cryptoApi = typeof crypto !== 'undefined' ? crypto : null

  if (cryptoApi?.getRandomValues) {
    const values = new Uint32Array(length)
    cryptoApi.getRandomValues(values)

    for (let i = 0; i < length; i += 1) {
      out += chars[values[i] % chars.length]
    }

    return out
  }

  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }

  return out
}

export function generateScratchCode() {
  return `${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}`
}

export function generatePublicCode(prefix = 'DC') {
  const safePrefix =
    String(prefix || 'DC')
      .replace(/[^A-Z0-9]/gi, '')
      .toUpperCase()
      .slice(0, LIMITS.prefix) || 'DC'

  return `${safePrefix}-${randomChunk(6)}-${randomChunk(4)}`
}

export async function createQrCode({
  code,
  scratch_code,
  label,
  code_type,
  template_id,
  assigned_email,
  created_by,
}) {
  const { value: safeCode, error: codeError } = validateQrCode(code)
  if (codeError) return { data: null, error: makeError(codeError) }

  const { value: safeScratchCode, error: scratchError } = validateScratchCode(scratch_code)
  if (scratchError) return { data: null, error: makeError(scratchError) }

  const { value: safeCodeType, error: codeTypeError } = sanitizeCodeType(code_type)
  if (codeTypeError) return { data: null, error: makeError(codeTypeError) }

  const { value: safeTemplateId, error: templateError } = sanitizeNullableUuid(
    template_id,
    'Template ID',
  )
  if (templateError) return { data: null, error: makeError(templateError) }

  if (safeCodeType === 'locked' && !safeTemplateId) {
    return { data: null, error: makeError('Locked QR codes must have a template assigned.') }
  }

  const { value: normalizedAssignedEmail, error: emailError } =
    validateAssignedEmail(assigned_email, 'Assigned email')
  if (emailError) return { data: null, error: makeError(emailError) }

  const { value: safeCreatedBy, error: createdByError } = sanitizeRequiredUuid(
    created_by,
    'Created by user ID',
  )
  if (createdByError) return { data: null, error: makeError(createdByError) }

  const payload = {
    code: safeCode,
    scratch_code: safeScratchCode,
    label: sanitizeSingleLineText(label, LIMITS.label) || null,
    code_type: safeCodeType,
    template_id: safeCodeType === 'locked' ? safeTemplateId : null,
    assigned_email: normalizedAssignedEmail,
    created_by: safeCreatedBy,
    activated: false,
    is_active: true,
    bulk_batch_id: null,
  }

  const { data, error } = await supabase
    .from('qr_codes')
    .insert(payload)
    .select()
    .single()

  return { data, error }
}

export async function createBulkQrCodes({
  count,
  prefix,
  labelPrefix,
  code_type,
  template_id,
  assigned_email,
  created_by,
}) {
  const safeCount = Math.max(1, Math.min(LIMITS.bulkQrCount, Number(count) || 1))

  const { value: safeCodeType, error: codeTypeError } = sanitizeCodeType(code_type)
  if (codeTypeError) return { data: null, error: makeError(codeTypeError) }

  const { value: safeTemplateId, error: templateError } = sanitizeNullableUuid(
    template_id,
    'Template ID',
  )
  if (templateError) return { data: null, error: makeError(templateError) }

  if (safeCodeType === 'locked' && !safeTemplateId) {
    return {
      data: null,
      error: makeError('Locked bulk QR codes must have a template assigned.'),
    }
  }

  const { value: normalizedAssignedEmail, error: emailError } =
    validateAssignedEmail(assigned_email, 'Assigned email')
  if (emailError) return { data: null, error: makeError(emailError) }

  const { value: safeCreatedBy, error: createdByError } = sanitizeRequiredUuid(
    created_by,
    'Created by user ID',
  )
  if (createdByError) return { data: null, error: makeError(createdByError) }

  const safeLabelPrefix = sanitizeSingleLineText(labelPrefix, LIMITS.label)
  const bulkBatchId = createUuid()

  const rows = Array.from({ length: safeCount }, (_, index) => ({
    code: generatePublicCode(prefix),
    scratch_code: generateScratchCode(),
    label: safeLabelPrefix ? `${safeLabelPrefix} ${index + 1}` : null,
    code_type: safeCodeType,
    template_id: safeCodeType === 'locked' ? safeTemplateId : null,
    assigned_email: normalizedAssignedEmail,
    created_by: safeCreatedBy,
    activated: false,
    is_active: true,
    bulk_batch_id: bulkBatchId,
  }))

  const { data, error } = await supabase.from('qr_codes').insert(rows).select()

  return { data, error }
}

export async function updateQrCode(qrCodeId, updates) {
  const { value: safeQrCodeId, error: qrCodeIdError } = sanitizeRequiredUuid(
    qrCodeId,
    'QR code ID',
  )
  if (qrCodeIdError) return { data: null, error: makeError(qrCodeIdError) }

  const { payload, error: validationError } = sanitizeQrUpdates(updates)
  if (validationError) return { data: null, error: makeError(validationError) }

  const { data, error } = await supabase
    .from('qr_codes')
    .update(payload)
    .eq('id', safeQrCodeId)
    .select()
    .single()

  return { data, error }
}

export async function deleteQrCode(qrCodeId) {
  const { value: safeQrCodeId, error: qrCodeIdError } = sanitizeRequiredUuid(
    qrCodeId,
    'QR code ID',
  )
  if (qrCodeIdError) return { error: makeError(qrCodeIdError) }

  const { error } = await supabase.from('qr_codes').delete().eq('id', safeQrCodeId)

  return { error }
}

export async function createArticle(payload) {
  const { payload: safePayload, error: validationError } = sanitizeArticlePayload(payload)
  if (validationError) return { data: null, error: makeError(validationError) }

  const { data, error } = await supabase
    .from('articles')
    .insert(safePayload)
    .select()
    .single()

  return { data, error }
}

export async function updateArticle(id, updates) {
  const { value: safeArticleId, error: articleIdError } = sanitizeRequiredUuid(
    id,
    'Article ID',
  )
  if (articleIdError) return { data: null, error: makeError(articleIdError) }

  const { payload: safePayload, error: validationError } = sanitizeArticlePayload(updates, {
    partial: true,
  })
  if (validationError) return { data: null, error: makeError(validationError) }

  const { data, error } = await supabase
    .from('articles')
    .update(safePayload)
    .eq('id', safeArticleId)
    .select()
    .single()

  return { data, error }
}

export async function deleteArticle(id) {
  const { value: safeArticleId, error: articleIdError } = sanitizeRequiredUuid(
    id,
    'Article ID',
  )
  if (articleIdError) return { error: makeError(articleIdError) }

  const { error } = await supabase.from('articles').delete().eq('id', safeArticleId)

  return { error }
}

export async function getPublishedArticles() {
  const { data, error } = await supabase
    .from('articles')
    .select('*')
    .eq('published', true)
    .order('date', { ascending: false })
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function activateQrCode(codeValue, scratch) {
  const { value: normalizedCode, error: codeError } = validateQrCode(codeValue)
  if (codeError) {
    return {
      data: null,
      error: { message: codeError },
    }
  }

  const { value: normalizedScratch, error: scratchError } = validateScratchCode(scratch)
  if (scratchError) {
    return {
      data: null,
      error: { message: scratchError },
    }
  }

  const { data, error } = await supabase.rpc('activate_qr_code', {
    p_code: normalizedCode,
    p_scratch_code: normalizedScratch,
  })

  if (error) {
    return { data: null, error }
  }

  if (!data?.success) {
    return {
      data: null,
      error: {
        message: data?.message || 'Activation failed.',
        status: data?.status,
        retryAfterSeconds: data?.retryAfterSeconds,
      },
    }
  }

  return { data, error: null }
}
