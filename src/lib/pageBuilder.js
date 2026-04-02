import { supabase } from './supabase'

export const defaultPageData = {
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

export function createColumn() {
  return {
    id: crypto.randomUUID(),
    blocks: [],
  }
}

export function createColumns(count = 1) {
  return Array.from({ length: count }, () => createColumn())
}

export function createEmptySection(index = 0, columnCount = 1) {
  return {
    id: crypto.randomUUID(),
    name: `Section ${index + 1}`,
    anchorId: '',
    paddingTop: 48,
    paddingBottom: 48,
    paddingSides: 24,
    background: {
      type: 'none',
      value: '',
    },
    columns: createColumns(columnCount),
  }
}

export function createTextBlock() {
  return {
    id: crypto.randomUUID(),
    type: 'text',
    content: 'New text block',
    align: 'left',
    size: 'md',
  }
}

export function createLinkBlock() {
  return {
    id: crypto.randomUUID(),
    type: 'link',
    label: 'New Link',
    url: '',
    sublabel: '',
  }
}

export function createDividerBlock() {
  return {
    id: crypto.randomUUID(),
    type: 'divider',
  }
}

export function createSpacerBlock() {
  return {
    id: crypto.randomUUID(),
    type: 'spacer',
    height: 24,
  }
}

export function createAvatarBlock() {
  return {
    id: crypto.randomUUID(),
    type: 'avatar',
    imageUrl: '',
    name: '',
    bio: '',
    size: 'md',
    showName: true,
    showBio: true,
    align: 'left',
  }
}

export function createImageBlock() {
  return {
    id: crypto.randomUUID(),
    type: 'image',
    imageUrl: '',
    alt: '',
    caption: '',
    borderRadius: 20,
  }
}

export function createBadgeBlock() {
  return {
    id: crypto.randomUUID(),
    type: 'badge',
    text: 'New Badge',
  }
}

export function createSocialsBlock() {
  return {
    id: crypto.randomUUID(),
    type: 'socials',
    title: 'Find me online',
    layout: 'list',
    items: [
      {
        id: crypto.randomUUID(),
        platform: 'instagram',
        label: 'Instagram',
        url: '',
      },
    ],
  }
}

export function createBlockByType(blockType) {
  if (blockType === 'avatar') return createAvatarBlock()
  if (blockType === 'text') return createTextBlock()
  if (blockType === 'link') return createLinkBlock()
  if (blockType === 'image') return createImageBlock()
  if (blockType === 'badge') return createBadgeBlock()
  if (blockType === 'divider') return createDividerBlock()
  if (blockType === 'spacer') return createSpacerBlock()
  if (blockType === 'socials') return createSocialsBlock()
  return null
}

export function resizeSectionColumns(section, newCount) {
  const targetCount = Math.max(1, Math.min(4, Number(newCount) || 1))
  const currentColumns = section.columns || []
  const nextColumns = [...currentColumns]

  if (nextColumns.length < targetCount) {
    while (nextColumns.length < targetCount) {
      nextColumns.push(createColumn())
    }
  } else if (nextColumns.length > targetCount) {
    nextColumns.length = targetCount
  }

  return {
    ...section,
    columns: nextColumns,
  }
}

export async function getEditableCodeProfileByCode(code, userId) {
  const normalizedCode = code?.trim()

  const { data: qrRows, error: qrError } = await supabase
    .from('qr_codes')
    .select('*')
    .eq('code', normalizedCode)
    .eq('activated_by', userId)

  if (qrError) {
    return {
      qrCode: null,
      codeProfile: null,
      error: qrError,
    }
  }

  if (!qrRows || qrRows.length === 0) {
    return {
      qrCode: null,
      codeProfile: null,
      error: new Error('Code not found.'),
    }
  }

  if (qrRows.length > 1) {
    return {
      qrCode: null,
      codeProfile: null,
      error: new Error('Duplicate code records found.'),
    }
  }

  const qrCode = qrRows[0]

  if (!qrCode.is_active) {
    return {
      qrCode: null,
      codeProfile: null,
      error: new Error('This QR code is inactive.'),
    }
  }

  if (!qrCode.activated) {
    return {
      qrCode: null,
      codeProfile: null,
      error: new Error('This QR code has not been activated yet.'),
    }
  }

  if (qrCode.code_type === 'locked') {
    return {
      qrCode,
      codeProfile: null,
      error: new Error('Locked codes cannot be edited in the page builder.'),
    }
  }

  const { data: profileRows, error: profileError } = await supabase
    .from('code_profiles')
    .select('*')
    .eq('qr_code_id', qrCode.id)
    .eq('user_id', userId)

  if (profileError) {
    return {
      qrCode,
      codeProfile: null,
      error: profileError,
    }
  }

  const codeProfile =
    profileRows && profileRows.length > 0 ? profileRows[0] : null

  if (!codeProfile) {
    return {
      qrCode,
      codeProfile: null,
      error: new Error('Editable profile not found for this code.'),
    }
  }

  return {
    qrCode,
    codeProfile,
    error: null,
  }
}

export async function saveCodeProfilePageData(codeProfileId, pageData, extras = {}) {
  const payload = {
    page_data: pageData,
    ...extras,
  }

  const { data, error } = await supabase
    .from('code_profiles')
    .update(payload)
    .eq('id', codeProfileId)
    .select('*')

  return {
    data: data && data.length > 0 ? data[0] : null,
    error,
  }
}
