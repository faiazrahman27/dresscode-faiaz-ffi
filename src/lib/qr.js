import { supabase } from './supabase'

export async function getQrCodeByCode(code) {
  const normalizedCode = code?.trim()

  const { data, error } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('code', normalizedCode)
    .maybeSingle()

  return { data, error }
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

function buildDefaultPageData() {
  return {
    version: 1,
    settings: {
      accentColor: '#5ECFCF',
      background: {
        type: 'color',
        value: '#0A1F1F',
        gradientFrom: '#0A1F1F',
        gradientTo: '#123B3B',
        gradientDirection: '135deg',
      },
      redirectUrl: '',
    },
    navbar: {
      enabled: false,
      brandText: '',
      links: [],
    },
    sections: [],
  }
}

export async function activateQrCode(codeValue, scratchCode) {
  const normalizedCode = codeValue?.trim()
  const normalizedScratch = scratchCode?.trim().toUpperCase()

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

  const { data, error } = await supabase
    .from('scans')
    .insert({
      qr_code_id: qrCodeId,
      device,
    })

  return { data, error }
}
