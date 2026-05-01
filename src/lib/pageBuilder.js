import { supabase } from './supabase'

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

const LIMITS = {
  code: 120,
  brandText: 80,
  navbarLabel: 80,
  anchorId: 80,
  url: 2048,
  sectionName: 120,
  textContent: 5000,
  shortText: 160,
  bio: 1000,
  caption: 240,
  badge: 80,
  sections: 40,
  columns: 4,
  blocksPerColumn: 80,
  socialsItems: 40,
  spacerMin: 0,
  spacerMax: 400,
  paddingMin: 0,
  paddingMax: 240,
  sidePaddingMax: 120,
  radiusMin: 0,
  radiusMax: 80,
}

const BACKGROUND_TYPES = new Set(['none', 'color', 'gradient'])
const NAV_LINK_TYPES = new Set(['anchor', 'external'])
const BLOCK_TYPES = new Set(['avatar', 'text', 'link', 'image', 'badge', 'divider', 'spacer', 'socials'])
const TEXT_ALIGNMENTS = new Set(['left', 'center', 'right'])
const BASIC_ALIGNMENTS = new Set(['left', 'center'])
const TEXT_SIZES = new Set(['sm', 'md', 'lg'])
const SOCIAL_LAYOUTS = new Set(['list', 'grid'])
const GRADIENT_DIRECTIONS = new Set(['90deg', '180deg', '135deg', '45deg'])
const SOCIAL_PLATFORMS = new Set([
  'instagram',
  'tiktok',
  'linkedin',
  'youtube',
  'twitter',
  'github',
  'spotify',
  'facebook',
  'discord',
  'website',
  'email',
  'phone',
])

const ALLOWED_PROFILE_EXTRA_FIELDS = new Set([
  'full_name',
  'bio',
  'avatar_url',
  'accent',
])

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

function createId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `local-${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function isPlainObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function sanitizeSingleLineText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, maxLength)
}

function sanitizeLiveText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .slice(0, maxLength)
}

function sanitizeMultilineText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{5,}/g, '\n\n\n\n')
    .slice(0, maxLength)
}

function sanitizeUrl(value) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .trim()
    .slice(0, LIMITS.url)
}

function hasUnsafeProtocol(value) {
  const normalized = String(value || '').trim().toLowerCase()
  return /^(javascript|data|vbscript):/.test(normalized)
}

function sanitizeAnchorId(value) {
  return String(value || '')
    .replace(/[^a-zA-Z0-9_-]/g, '')
    .slice(0, LIMITS.anchorId)
}

function sanitizeNumber(value, min, max, fallback) {
  const number = Number(value)

  if (!Number.isFinite(number)) {
    return fallback
  }

  return Math.max(min, Math.min(max, number))
}

function isValidHexColor(value) {
  return /^#([0-9A-Fa-f]{6})$/.test(String(value || '').trim())
}

function normalizeHexColor(value, fallback) {
  const trimmed = String(value || '').trim()
  return isValidHexColor(trimmed) ? trimmed : fallback
}

function sanitizeEnum(value, allowedSet, fallback) {
  return allowedSet.has(value) ? value : fallback
}

function sanitizeCodeValue(code) {
  return String(code || '')
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .slice(0, LIMITS.code)
}

function sanitizeUuid(value) {
  const normalized = String(value || '').trim()
  return UUID_PATTERN.test(normalized) ? normalized : ''
}

function validateSafePageUrls(pageData) {
  if (hasUnsafeProtocol(pageData?.settings?.redirectUrl)) {
    return 'Redirect URL uses an unsafe protocol.'
  }

  for (const link of pageData?.navbar?.links || []) {
    if (hasUnsafeProtocol(link.url)) {
      return 'Navbar URL uses an unsafe protocol.'
    }
  }

  for (const section of pageData?.sections || []) {
    for (const column of section.columns || []) {
      for (const block of column.blocks || []) {
        if (hasUnsafeProtocol(block.url) || hasUnsafeProtocol(block.imageUrl)) {
          return 'A page block contains an unsafe URL.'
        }

        for (const item of block.items || []) {
          if (hasUnsafeProtocol(item.url)) {
            return 'A social link contains an unsafe URL.'
          }
        }
      }
    }
  }

  return ''
}

function sanitizeNavbarLink(link) {
  const safeLink = isPlainObject(link) ? link : {}
  const type = sanitizeEnum(
    safeLink.type || (safeLink.url ? 'external' : 'anchor'),
    NAV_LINK_TYPES,
    'anchor',
  )

  return {
    id: safeLink.id || createId(),
    label: sanitizeSingleLineText(safeLink.label || 'Link', LIMITS.navbarLabel),
    type,
    anchorId: type === 'anchor' ? sanitizeAnchorId(safeLink.anchorId || '') : '',
    url: type === 'external' ? sanitizeUrl(safeLink.url || '') : '',
  }
}

function sanitizeSocialItem(item) {
  const safeItem = isPlainObject(item) ? item : {}

  return {
    id: safeItem.id || createId(),
    platform: sanitizeEnum(safeItem.platform || 'website', SOCIAL_PLATFORMS, 'website'),
    label: sanitizeSingleLineText(safeItem.label || 'Social', LIMITS.shortText),
    url: sanitizeUrl(safeItem.url || ''),
  }
}

function sanitizeBlock(block) {
  if (!isPlainObject(block) || !BLOCK_TYPES.has(block.type)) {
    return null
  }

  if (block.type === 'avatar') {
    return {
      id: block.id || createId(),
      type: 'avatar',
      imageUrl: sanitizeUrl(block.imageUrl || ''),
      name: sanitizeSingleLineText(block.name || '', LIMITS.shortText),
      bio: sanitizeMultilineText(block.bio || '', LIMITS.bio),
      size: sanitizeEnum(block.size || 'md', TEXT_SIZES, 'md'),
      showName: block.showName !== false,
      showBio: block.showBio !== false,
      align: sanitizeEnum(block.align || 'left', BASIC_ALIGNMENTS, 'left'),
    }
  }

  if (block.type === 'text') {
    return {
      id: block.id || createId(),
      type: 'text',
      content: sanitizeMultilineText(block.content || '', LIMITS.textContent),
      align: sanitizeEnum(block.align || 'left', TEXT_ALIGNMENTS, 'left'),
      size: sanitizeEnum(block.size || 'md', TEXT_SIZES, 'md'),
    }
  }

  if (block.type === 'link') {
    return {
      id: block.id || createId(),
      type: 'link',
      label: sanitizeSingleLineText(block.label || 'Untitled link', LIMITS.shortText),
      url: sanitizeUrl(block.url || ''),
      sublabel: sanitizeSingleLineText(block.sublabel || '', LIMITS.shortText),
    }
  }

  if (block.type === 'image') {
    return {
      id: block.id || createId(),
      type: 'image',
      imageUrl: sanitizeUrl(block.imageUrl || ''),
      alt: sanitizeSingleLineText(block.alt || '', LIMITS.shortText),
      caption: sanitizeSingleLineText(block.caption || '', LIMITS.caption),
      borderRadius: sanitizeNumber(block.borderRadius, LIMITS.radiusMin, LIMITS.radiusMax, 20),
    }
  }

  if (block.type === 'badge') {
    return {
      id: block.id || createId(),
      type: 'badge',
      text: sanitizeSingleLineText(block.text || 'Badge', LIMITS.badge),
    }
  }

  if (block.type === 'divider') {
    return {
      id: block.id || createId(),
      type: 'divider',
    }
  }

  if (block.type === 'spacer') {
    return {
      id: block.id || createId(),
      type: 'spacer',
      height: sanitizeNumber(block.height, LIMITS.spacerMin, LIMITS.spacerMax, 24),
    }
  }

  if (block.type === 'socials') {
    return {
      id: block.id || createId(),
      type: 'socials',
      title: sanitizeSingleLineText(block.title || 'Find me online', LIMITS.shortText),
      layout: sanitizeEnum(block.layout || 'list', SOCIAL_LAYOUTS, 'list'),
      items: Array.isArray(block.items)
        ? block.items.slice(0, LIMITS.socialsItems).map(sanitizeSocialItem)
        : [],
    }
  }

  return null
}

function sanitizeSection(section, index) {
  const safeSection = isPlainObject(section) ? section : {}
  const rawColumns = Array.isArray(safeSection.columns) ? safeSection.columns : createColumns(1)
  const columns = rawColumns.slice(0, LIMITS.columns).map((column) => {
    const safeColumn = isPlainObject(column) ? column : {}

    return {
      id: safeColumn.id || createId(),
      blocks: Array.isArray(safeColumn.blocks)
        ? safeColumn.blocks
            .slice(0, LIMITS.blocksPerColumn)
            .map(sanitizeBlock)
            .filter(Boolean)
        : [],
    }
  })

  return {
    id: safeSection.id || createId(),
    name: sanitizeSingleLineText(safeSection.name || `Section ${index + 1}`, LIMITS.sectionName),
    anchorId: sanitizeAnchorId(safeSection.anchorId || ''),
    paddingTop: sanitizeNumber(safeSection.paddingTop, LIMITS.paddingMin, LIMITS.paddingMax, 48),
    paddingBottom: sanitizeNumber(safeSection.paddingBottom, LIMITS.paddingMin, LIMITS.paddingMax, 48),
    paddingSides: sanitizeNumber(safeSection.paddingSides, LIMITS.paddingMin, LIMITS.sidePaddingMax, 24),
    background: {
      type: sanitizeEnum(safeSection.background?.type || 'none', BACKGROUND_TYPES, 'none'),
      value:
        safeSection.background?.type === 'color'
          ? normalizeHexColor(safeSection.background?.value, '')
          : '',
    },
    columns: columns.length ? columns : createColumns(1),
  }
}

export function sanitizePageDataForStorage(pageData) {
  const safePageData = isPlainObject(pageData) ? pageData : defaultPageData
  const settings = isPlainObject(safePageData.settings) ? safePageData.settings : {}
  const background = isPlainObject(settings.background) ? settings.background : {}
  const navbar = isPlainObject(safePageData.navbar) ? safePageData.navbar : {}

  const cleaned = {
    version: 1,
    settings: {
      accentColor: normalizeHexColor(settings.accentColor, '#5ECFCF'),
      background: {
        type: sanitizeEnum(background.type || 'color', BACKGROUND_TYPES, 'color'),
        value: normalizeHexColor(background.value, '#0A1F1F'),
        gradientFrom: normalizeHexColor(background.gradientFrom, '#0A1F1F'),
        gradientTo: normalizeHexColor(background.gradientTo, '#123B3B'),
        gradientDirection: sanitizeEnum(
          background.gradientDirection || '135deg',
          GRADIENT_DIRECTIONS,
          '135deg',
        ),
      },
      redirectUrl: sanitizeUrl(settings.redirectUrl || ''),
    },
    navbar: {
      enabled: Boolean(navbar.enabled),
      brandText: sanitizeSingleLineText(navbar.brandText || '', LIMITS.brandText),
      links: Array.isArray(navbar.links) ? navbar.links.map(sanitizeNavbarLink) : [],
    },
    sections: Array.isArray(safePageData.sections)
      ? safePageData.sections.slice(0, LIMITS.sections).map(sanitizeSection)
      : [],
  }

  const unsafeUrlError = validateSafePageUrls(cleaned)

  if (unsafeUrlError) {
    return {
      data: null,
      error: new Error(unsafeUrlError),
    }
  }

  return {
    data: cleaned,
    error: null,
  }
}

function sanitizeProfileExtras(extras = {}) {
  if (!isPlainObject(extras)) {
    return {
      data: null,
      error: new Error('Invalid profile metadata.'),
    }
  }

  const unexpectedFields = Object.keys(extras).filter(
    (key) => !ALLOWED_PROFILE_EXTRA_FIELDS.has(key),
  )

  if (unexpectedFields.length) {
    return {
      data: null,
      error: new Error(`Unexpected profile fields: ${unexpectedFields.join(', ')}`),
    }
  }

  const payload = {}

  if (Object.prototype.hasOwnProperty.call(extras, 'full_name')) {
    payload.full_name = sanitizeSingleLineText(extras.full_name, LIMITS.shortText)
  }

  if (Object.prototype.hasOwnProperty.call(extras, 'bio')) {
    payload.bio = sanitizeMultilineText(extras.bio, LIMITS.bio)
  }

  if (Object.prototype.hasOwnProperty.call(extras, 'avatar_url')) {
    const avatarUrl = sanitizeUrl(extras.avatar_url)

    if (hasUnsafeProtocol(avatarUrl)) {
      return {
        data: null,
        error: new Error('Avatar URL uses an unsafe protocol.'),
      }
    }

    payload.avatar_url = avatarUrl
  }

  if (Object.prototype.hasOwnProperty.call(extras, 'accent')) {
    payload.accent = normalizeHexColor(extras.accent, '#5ECFCF')
  }

  return {
    data: payload,
    error: null,
  }
}

export function createColumn() {
  return {
    id: createId(),
    blocks: [],
  }
}

export function createColumns(count = 1) {
  const safeCount = sanitizeNumber(count, 1, LIMITS.columns, 1)
  return Array.from({ length: safeCount }, () => createColumn())
}

export function createEmptySection(index = 0, columnCount = 1) {
  return {
    id: createId(),
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
    id: createId(),
    type: 'text',
    content: 'New text block',
    align: 'left',
    size: 'md',
  }
}

export function createLinkBlock() {
  return {
    id: createId(),
    type: 'link',
    label: 'New Link',
    url: '',
    sublabel: '',
  }
}

export function createDividerBlock() {
  return {
    id: createId(),
    type: 'divider',
  }
}

export function createSpacerBlock() {
  return {
    id: createId(),
    type: 'spacer',
    height: 24,
  }
}

export function createAvatarBlock() {
  return {
    id: createId(),
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
    id: createId(),
    type: 'image',
    imageUrl: '',
    alt: '',
    caption: '',
    borderRadius: 20,
  }
}

export function createBadgeBlock() {
  return {
    id: createId(),
    type: 'badge',
    text: 'New Badge',
  }
}

export function createSocialsBlock() {
  return {
    id: createId(),
    type: 'socials',
    title: 'Find me online',
    layout: 'list',
    items: [
      {
        id: createId(),
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
  const targetCount = sanitizeNumber(newCount, 1, LIMITS.columns, 1)
  const currentColumns = Array.isArray(section?.columns) ? section.columns : []
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
  const normalizedCode = sanitizeCodeValue(code)
  const normalizedUserId = sanitizeUuid(userId)

  if (!normalizedCode) {
    return {
      qrCode: null,
      codeProfile: null,
      error: new Error('Code is required.'),
    }
  }

  if (!normalizedUserId) {
    return {
      qrCode: null,
      codeProfile: null,
      error: new Error('You need to sign in first.'),
    }
  }

  // Safe authenticated RPC from migration 003.
  // This avoids client-side direct reads of scratch_code or assigned_email.
  const { data: qrRows, error: qrError } = await supabase.rpc(
    'get_editable_qr_by_code',
    {
      p_code: normalizedCode,
    },
  )

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

  if (qrCode.activated_by && qrCode.activated_by !== normalizedUserId) {
    return {
      qrCode: null,
      codeProfile: null,
      error: new Error('This code is not available for editing.'),
    }
  }

  const { data: profileRows, error: profileError } = await supabase
    .from('code_profiles')
    .select('*')
    .eq('qr_code_id', qrCode.id)
    .eq('user_id', normalizedUserId)
    .limit(2)

  if (profileError) {
    return {
      qrCode,
      codeProfile: null,
      error: profileError,
    }
  }

  if (profileRows && profileRows.length > 1) {
    return {
      qrCode,
      codeProfile: null,
      error: new Error('Duplicate editable profiles found for this code.'),
    }
  }

  const codeProfile = profileRows && profileRows.length > 0 ? profileRows[0] : null

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
  const normalizedCodeProfileId = sanitizeUuid(codeProfileId)

  if (!normalizedCodeProfileId) {
    return {
      data: null,
      error: new Error('Invalid profile ID.'),
    }
  }

  const { data: cleanedPageData, error: pageDataError } = sanitizePageDataForStorage(pageData)

  if (pageDataError) {
    return {
      data: null,
      error: pageDataError,
    }
  }

  const { data: cleanedExtras, error: extrasError } = sanitizeProfileExtras(extras)

  if (extrasError) {
    return {
      data: null,
      error: extrasError,
    }
  }

  const payload = {
    page_data: cleanedPageData,
    ...cleanedExtras,
  }

  const { data, error } = await supabase
    .from('code_profiles')
    .update(payload)
    .eq('id', normalizedCodeProfileId)
    .select('*')
    .limit(1)

  return {
    data: data && data.length > 0 ? data[0] : null,
    error,
  }
}
