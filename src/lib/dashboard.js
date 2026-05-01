import { supabase } from './supabase'
import { defaultPageData } from './pageBuilder'

export function normalizeAssignedEmail(email) {
  const normalized = email?.trim().toLowerCase()
  return normalized || null
}

export async function getMyQrCodes(userId, email = '') {
  if (!userId) {
    return { data: [], error: null }
  }

  // Safe authenticated RPC.
  // Does not return scratch_code or assigned_email.
  // It returns safe booleans like assigned_to_current_email instead.
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
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function updateUserRole(userId, role) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)
    .select()
    .single()

  return { data, error }
}

export async function getPendingAssignments() {
  const { data, error } = await supabase
    .from('pending_assignments')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function createPendingAssignment({
  email,
  role,
  qr_code_id = null,
  created_by,
}) {
  const normalizedEmail = normalizeAssignedEmail(email)

  const { data, error } = await supabase
    .from('pending_assignments')
    .insert({
      email: normalizedEmail,
      role,
      qr_code_id,
      created_by,
    })
    .select()
    .single()

  return { data, error }
}

export async function deletePendingAssignment(id) {
  const { error } = await supabase.from('pending_assignments').delete().eq('id', id)

  return { error }
}

export async function getAllQrCodes() {
  // Admin-only dashboard call.
  // Admins intentionally need full QR rows for scratch-code export, CSV, and assignment management.
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getMyArticles(userId, isAdmin = false) {
  let query = supabase
    .from('articles')
    .select('*')
    .order('created_at', { ascending: false })

  if (!isAdmin) {
    query = query.eq('author_id', userId)
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
  const { data, error } = await supabase
    .from('content_templates')
    .insert({
      name,
      created_by: userId,
      page_data: defaultPageData,
    })
    .select()
    .single()

  return { data, error }
}

export async function updateTemplate(templateId, updates) {
  const { data, error } = await supabase
    .from('content_templates')
    .update(updates)
    .eq('id', templateId)
    .select()
    .single()

  return { data, error }
}

function randomChunk(length) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let out = ''
  for (let i = 0; i < length; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)]
  }
  return out
}

export function generateScratchCode() {
  return `${randomChunk(4)}-${randomChunk(4)}-${randomChunk(4)}`
}

export function generatePublicCode(prefix = 'DC') {
  const safePrefix = (prefix || 'DC').replace(/[^A-Z0-9]/gi, '').toUpperCase() || 'DC'
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
  const normalizedAssignedEmail = normalizeAssignedEmail(assigned_email)

  const payload = {
    code,
    scratch_code,
    label: label || null,
    code_type,
    template_id: code_type === 'locked' ? template_id || null : null,
    assigned_email: normalizedAssignedEmail,
    created_by,
    activated: false,
    is_active: true,
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
  const safeCount = Math.max(1, Math.min(500, Number(count) || 1))
  const normalizedAssignedEmail = normalizeAssignedEmail(assigned_email)

  const rows = Array.from({ length: safeCount }, (_, index) => ({
    code: generatePublicCode(prefix),
    scratch_code: generateScratchCode(),
    label: labelPrefix ? `${labelPrefix} ${index + 1}` : null,
    code_type,
    template_id: code_type === 'locked' ? template_id || null : null,
    assigned_email: normalizedAssignedEmail,
    created_by,
    activated: false,
    is_active: true,
  }))

  const { data, error } = await supabase.from('qr_codes').insert(rows).select()

  return { data, error }
}

export async function updateQrCode(qrCodeId, updates) {
  const payload = { ...updates }

  if (Object.prototype.hasOwnProperty.call(payload, 'assigned_email')) {
    payload.assigned_email = normalizeAssignedEmail(payload.assigned_email)
  }

  const { data, error } = await supabase
    .from('qr_codes')
    .update(payload)
    .eq('id', qrCodeId)
    .select()
    .single()

  return { data, error }
}

export async function deleteQrCode(qrCodeId) {
  const { error } = await supabase.from('qr_codes').delete().eq('id', qrCodeId)

  return { error }
}

export async function createArticle(payload) {
  const { data, error } = await supabase
    .from('articles')
    .insert(payload)
    .select()
    .single()

  return { data, error }
}

export async function updateArticle(id, updates) {
  const { data, error } = await supabase
    .from('articles')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  return { data, error }
}

export async function deleteArticle(id) {
  const { error } = await supabase.from('articles').delete().eq('id', id)

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
  const normalizedCode = codeValue?.trim()
  const normalizedScratch = scratch?.trim().toUpperCase()

  if (!normalizedCode) {
    return {
      data: null,
      error: { message: 'QR code is required.' },
    }
  }

  if (!normalizedScratch) {
    return {
      data: null,
      error: { message: 'Scratch code is required.' },
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
      error: { message: data?.message || 'Activation failed.' },
    }
  }

  return { data, error: null }
}
