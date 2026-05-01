import { supabase } from './supabase'

const QR_CODE_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{2,79}$/
const SCRATCH_CODE_PATTERN = /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/

function normalizeCode(code) {
  return code?.trim() || ''
}

function normalizeScratchCode(scratchCode) {
  return scratchCode?.trim().toUpperCase() || ''
}

function isValidQrCodeFormat(code) {
  return QR_CODE_PATTERN.test(code)
}

function isValidScratchCodeFormat(scratchCode) {
  return SCRATCH_CODE_PATTERN.test(scratchCode)
}

function getSafeDeviceString() {
  if (typeof navigator === 'undefined') return null

  return navigator.userAgent
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .slice(0, 160)
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

  if (!isValidQrCodeFormat(normalizedCode)) {
    return {
      data: null,
      error: { message: 'Invalid QR code format.' },
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

    if (data?.status === 429) {
      return {
        data: null,
        error: {
          message,
          status: 429,
          retryAfterSeconds: data?.retryAfterSeconds,
        },
      }
    }

    if (message.toLowerCase().includes('not found')) {
      return { data: null, error: null }
    }

    return {
      data: null,
      error: {
        message,
        status: data?.status,
      },
    }
  }

  return {
    data: normalizeQrState(data.qr),
    error: null,
  }
}

export async function getCodeProfileByQrId(qrCodeId) {
  if (!qrCodeId) {
    return {
      data: null,
      error: { message: 'QR code ID is required.' },
    }
  }

  const { data, error } = await supabase
    .from('code_profiles')
    .select('*')
    .eq('qr_code_id', qrCodeId)
    .maybeSingle()

  return { data, error }
}

export async function getTemplateById(templateId) {
  if (!templateId) {
    return {
      data: null,
      error: { message: 'Template ID is required.' },
    }
  }

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

  if (!isValidQrCodeFormat(normalizedCode)) {
    return {
      data: null,
      error: { message: 'Invalid QR code format.' },
    }
  }

  if (!normalizedScratch) {
    return {
      data: null,
      error: { message: 'Scratch code is required.' },
    }
  }

  if (!isValidScratchCodeFormat(normalizedScratch)) {
    return {
      data: null,
      error: { message: 'Invalid scratch code format. Use XXXX-XXXX-XXXX.' },
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

  return {
    data,
    error: null,
  }
}

export async function insertScan(qrCodeId) {
  if (!qrCodeId) {
    return {
      data: null,
      error: { message: 'QR code ID is required.' },
    }
  }

  const device = getSafeDeviceString()

  // Security hardening:
  // Public scan writes go through the controlled RPC instead of direct table insert.
  // The RPC handles validation/rate-limit logic server-side and inserts only allowed fields.
  const { data, error } = await supabase.rpc('record_public_scan', {
    p_qr_code_id: qrCodeId,
    p_device: device,
  })

  if (error) {
    return { data: null, error }
  }

  if (!data?.success) {
    return {
      data: null,
      error: {
        message: data?.message || 'Scan could not be recorded.',
        status: data?.status,
        retryAfterSeconds: data?.retryAfterSeconds,
      },
    }
  }

  return { data, error: null }
}
