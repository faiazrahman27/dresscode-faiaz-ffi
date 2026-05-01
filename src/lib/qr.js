import { supabase } from './supabase'

function normalizeCode(code) {
  return code?.trim() || ''
}

function normalizeScratchCode(scratchCode) {
  return scratchCode?.trim().toUpperCase() || ''
}

function normalizeQrState(qr) {
  if (!qr) return null

  return {
    ...qr,

    // Safe assignment-state fields returned by get_qr_activation_state.
    // These do not expose assigned_email.
    has_email_assignment: Boolean(qr.has_email_assignment),
    assigned_to_current_email: Boolean(qr.assigned_to_current_email),
    assigned_to_different_email: Boolean(qr.assigned_to_different_email),
    has_user_assignment: Boolean(qr.has_user_assignment),
    assigned_to_current_user: Boolean(qr.assigned_to_current_user),
    assigned_to_different_user: Boolean(qr.assigned_to_different_user),
  }
}

export async function getQrCodeByCode(code) {
  const normalizedCode = normalizeCode(code)

  if (!normalizedCode) {
    return {
      data: null,
      error: { message: 'QR code is required.' },
    }
  }

  const { data, error } = await supabase.rpc('get_qr_activation_state', {
    p_code: normalizedCode,
  })

  if (error) {
    return { data: null, error }
  }

  if (!data?.success) {
    const message = data?.message || 'QR code not found.'

    if (message.toLowerCase().includes('not found')) {
      return { data: null, error: null }
    }

    return {
      data: null,
      error: { message },
    }
  }

  return {
    data: normalizeQrState(data.qr),
    error: null,
  }
}

export async function getCodeProfileByQrId(qrCodeId) {
  const { data, error } = await supabase
    .from('code_profiles')
    .select('*')
    .eq('qr_code_id', qrCodeId)
    .maybeSingle()

  return { data, error }
}

export async function getTemplateById(templateId) {
  const { data, error } = await supabase
    .from('content_templates')
    .select('*')
    .eq('id', templateId)
    .maybeSingle()

  return { data, error }
}

export async function activateQrCode(codeValue, scratchCode) {
  const normalizedCode = normalizeCode(codeValue)
  const normalizedScratch = normalizeScratchCode(scratchCode)

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

  return {
    data,
    error: null,
  }
}

export async function insertScan(qrCodeId) {
  const device =
    typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 120) : null

  const { data, error } = await supabase.from('scans').insert({
    qr_code_id: qrCodeId,
    device,
  })

  return { data, error }
}
