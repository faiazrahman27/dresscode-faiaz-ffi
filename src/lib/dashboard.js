import { supabase } from './supabase'
import { defaultPageData } from './pageBuilder'

export async function getMyQrCodes(userId) {
  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .or(`assigned_to.eq.${userId},activated_by.eq.${userId}`)
    .order('created_at', { ascending: false })

  return { data, error }
}

export async function getScanCountForUserCodes(userId) {
  const { data: codes, error: codesError } = await supabase
    .from('qr_codes')
    .select('id')
    .eq('activated_by', userId)

  if (codesError) {
    return { count: 0, error: codesError }
  }

  const ids = (codes || []).map((item) => item.id)

  if (!ids.length) {
    return { count: 0, error: null }
  }

  const { count, error } = await supabase
    .from('scans')
    .select('*', { count: 'exact', head: true })
    .in('qr_code_id', ids)

  return { count: count || 0, error }
}

export async function getRecentScansForUserCodes(userId, limit = 20) {
  const { data: codes, error: codesError } = await supabase
    .from('qr_codes')
    .select('id, code, label')
    .eq('activated_by', userId)

  if (codesError) {
    return { data: [], error: codesError }
  }

  const codeRows = codes || []
  const ids = codeRows.map((item) => item.id)

  if (!ids.length) {
    return { data: [], error: null }
  }

  const codeMap = Object.fromEntries(
    codeRows.map((item) => [
      item.id,
      {
        code: item.code,
        label: item.label,
      },
    ])
  )

  const { data: scans, error } = await supabase
    .from('scans')
    .select('*')
    .in('qr_code_id', ids)
    .order('scanned_at', { ascending: false })
    .limit(limit)

  if (error) {
    return { data: [], error }
  }

  const enriched = (scans || []).map((scan) => ({
    ...scan,
    qr_code: codeMap[scan.qr_code_id] || null,
  }))

  return { data: enriched, error: null }
}

export async function getScanBreakdownForUserCodes(userId) {
  const { data: codes, error: codesError } = await supabase
    .from('qr_codes')
    .select('id, code, label')
    .eq('activated_by', userId)

  if (codesError) {
    return { data: [], error: codesError }
  }

  const codeRows = codes || []
  const ids = codeRows.map((item) => item.id)

  if (!ids.length) {
    return { data: [], error: null }
  }

  const { data: scans, error } = await supabase
    .from('scans')
    .select('qr_code_id')
    .in('qr_code_id', ids)

  if (error) {
    return { data: [], error }
  }

  const counts = {}
  for (const scan of scans || []) {
    counts[scan.qr_code_id] = (counts[scan.qr_code_id] || 0) + 1
  }

  const breakdown = codeRows
    .map((item) => ({
      qr_code_id: item.id,
      code: item.code,
      label: item.label,
      scans: counts[item.id] || 0,
    }))
    .sort((a, b) => b.scans - a.scans)

  return { data: breakdown, error: null }
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
  const { data, error } = await supabase
    .from('pending_assignments')
    .insert({
      email,
      role,
      qr_code_id,
      created_by,
    })
    .select()
    .single()

  return { data, error }
}

export async function deletePendingAssignment(id) {
  const { error } = await supabase
    .from('pending_assignments')
    .delete()
    .eq('id', id)

  return { error }
}

export async function getAllQrCodes() {
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
  created_by,
}) {
  const payload = {
    code,
    scratch_code,
    label: label || null,
    code_type,
    template_id: code_type === 'locked' ? template_id || null : null,
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
  created_by,
}) {
  const safeCount = Math.max(1, Math.min(500, Number(count) || 1))
  const rows = Array.from({ length: safeCount }, (_, index) => ({
    code: generatePublicCode(prefix),
    scratch_code: generateScratchCode(),
    label: labelPrefix ? `${labelPrefix} ${index + 1}` : null,
    code_type,
    template_id: code_type === 'locked' ? template_id || null : null,
    created_by,
    activated: false,
    is_active: true,
  }))

  const { data, error } = await supabase
    .from('qr_codes')
    .insert(rows)
    .select()

  return { data, error }
}

export async function updateQrCode(qrCodeId, updates) {
  const { data, error } = await supabase
    .from('qr_codes')
    .update(updates)
    .eq('id', qrCodeId)
    .select()
    .single()

  return { data, error }
}

export async function deleteQrCode(qrCodeId) {
  const { error } = await supabase
    .from('qr_codes')
    .delete()
    .eq('id', qrCodeId)

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
  const { error } = await supabase
    .from('articles')
    .delete()
    .eq('id', id)

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

export async function activateQrCode(codeValue, scratch, userId) {
  const { data: qr, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('code', codeValue)
    .single()

  if (error || !qr) {
    return { error: { message: 'Invalid code' } }
  }

  if (qr.activated) {
    return { error: { message: 'Already activated' } }
  }

  if (qr.scratch_code !== scratch) {
    return { error: { message: 'Invalid scratch code' } }
  }

  const { data, error: updateError } = await supabase
    .from('qr_codes')
    .update({
      activated: true,
      activated_by: userId,
      activated_at: new Date().toISOString(),
    })
    .eq('id', qr.id)
    .select()
    .single()

  return { data, error: updateError }
}
