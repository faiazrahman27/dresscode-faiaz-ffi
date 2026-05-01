import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import {
  createBlockByType,
  createEmptySection,
  defaultPageData,
  getEditableCodeProfileByCode,
  resizeSectionColumns,
  saveCodeProfilePageData,
} from '../lib/pageBuilder'
import { getPublicProfileUrl } from '../lib/site'
import { uploadImageToAvatars } from '../lib/storage'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
}

const heroStagger = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
      delayChildren: 0.04,
    },
  },
}

const LIMITS = {
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
  blocksPerColumn: 80,
  socialsItems: 40,
  spacerMin: 0,
  spacerMax: 400,
  radiusMin: 0,
  radiusMax: 80,
}

const BACKGROUND_TYPES = new Set(['color', 'gradient', 'none'])
const NAV_LINK_TYPES = new Set(['anchor', 'external'])
const TEXT_ALIGNMENTS = new Set(['left', 'center', 'right'])
const BASIC_ALIGNMENTS = new Set(['left', 'center'])
const SOCIAL_LAYOUTS = new Set(['list', 'grid'])
const GRADIENT_DIRECTIONS = new Set(['90deg', '180deg', '135deg', '45deg'])
const BLOCK_TYPES = new Set(['avatar', 'text', 'link', 'image', 'badge', 'divider', 'spacer', 'socials'])
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

function sanitizeLiveText(value, maxLength) {
  return String(value || '')
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .slice(0, maxLength)
}

function sanitizeSingleLineText(value, maxLength) {
  return sanitizeLiveText(value, maxLength).replace(/\s+/g, ' ').trim()
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
  return /^#([0-9A-Fa-f]{6})$/.test(value)
}

function normalizeHexColor(value, fallback) {
  if (!value) return fallback
  const trimmed = String(value).trim()
  return isValidHexColor(trimmed) ? trimmed : fallback
}

function sanitizeBackgroundType(value, fallback = 'color') {
  return BACKGROUND_TYPES.has(value) ? value : fallback
}

function sanitizeGradientDirection(value) {
  return GRADIENT_DIRECTIONS.has(value) ? value : '135deg'
}

function sanitizeNavbarLinkType(value) {
  return NAV_LINK_TYPES.has(value) ? value : 'anchor'
}

function sanitizeSocialPlatform(value) {
  return SOCIAL_PLATFORMS.has(value) ? value : 'website'
}

function sanitizeSocialLayout(value) {
  return SOCIAL_LAYOUTS.has(value) ? value : 'list'
}

function sanitizeTextAlign(value) {
  return TEXT_ALIGNMENTS.has(value) ? value : 'left'
}

function sanitizeBasicAlign(value) {
  return BASIC_ALIGNMENTS.has(value) ? value : 'left'
}

function findUnsafeUrl(pageData) {
  const settings = pageData.settings || {}

  if (hasUnsafeProtocol(settings.redirectUrl)) {
    return 'Redirect URL uses an unsafe protocol.'
  }

  for (const link of pageData.navbar?.links || []) {
    if (hasUnsafeProtocol(link.url)) {
      return 'Navbar URL uses an unsafe protocol.'
    }
  }

  for (const section of pageData.sections || []) {
    for (const column of section.columns || []) {
      for (const block of column.blocks || []) {
        if (hasUnsafeProtocol(block.url) || hasUnsafeProtocol(block.imageUrl)) {
          return 'A block contains an unsafe URL.'
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

function createNavbarLink() {
  return {
    id: crypto.randomUUID(),
    label: 'New Link',
    type: 'anchor',
    anchorId: '',
    url: '',
  }
}

function createSocialItem() {
  return {
    id: crypto.randomUUID(),
    platform: 'instagram',
    label: 'Instagram',
    url: '',
  }
}

function sanitizeNavbarLink(link) {
  const type = sanitizeNavbarLinkType(link?.type || (link?.url ? 'external' : 'anchor'))

  return {
    id: link?.id || crypto.randomUUID(),
    label: sanitizeSingleLineText(link?.label || 'Link', LIMITS.navbarLabel),
    type,
    anchorId: sanitizeAnchorId(link?.anchorId || ''),
    url: type === 'external' ? sanitizeUrl(link?.url || '') : '',
  }
}

function sanitizeSocialItem(item) {
  return {
    id: item?.id || crypto.randomUUID(),
    platform: sanitizeSocialPlatform(item?.platform || 'website'),
    label: sanitizeSingleLineText(item?.label || 'Social', LIMITS.shortText),
    url: sanitizeUrl(item?.url || ''),
  }
}

function sanitizeBlock(block) {
  if (!block || !BLOCK_TYPES.has(block.type)) return null

  if (block.type === 'text') {
    return {
      id: block.id || crypto.randomUUID(),
      type: 'text',
      content: sanitizeMultilineText(block.content || '', LIMITS.textContent),
      align: sanitizeTextAlign(block.align || 'left'),
      size: ['sm', 'md', 'lg'].includes(block.size) ? block.size : 'md',
    }
  }

  if (block.type === 'link') {
    return {
      id: block.id || crypto.randomUUID(),
      type: 'link',
      label: sanitizeSingleLineText(block.label || 'Untitled link', LIMITS.shortText),
      url: sanitizeUrl(block.url || ''),
      sublabel: sanitizeSingleLineText(block.sublabel || '', LIMITS.shortText),
    }
  }

  if (block.type === 'socials') {
    return {
      id: block.id || crypto.randomUUID(),
      type: 'socials',
      title: sanitizeSingleLineText(block.title || '', LIMITS.shortText),
      layout: sanitizeSocialLayout(block.layout || 'list'),
      items: (block.items || []).slice(0, LIMITS.socialsItems).map(sanitizeSocialItem),
    }
  }

  if (block.type === 'avatar') {
    return {
      id: block.id || crypto.randomUUID(),
      type: 'avatar',
      imageUrl: sanitizeUrl(block.imageUrl || ''),
      name: sanitizeSingleLineText(block.name || '', LIMITS.shortText),
      bio: sanitizeMultilineText(block.bio || '', LIMITS.bio),
      size: ['sm', 'md', 'lg'].includes(block.size) ? block.size : 'md',
      showName: block.showName !== false,
      showBio: block.showBio !== false,
      align: sanitizeBasicAlign(block.align || 'left'),
    }
  }

  if (block.type === 'image') {
    return {
      id: block.id || crypto.randomUUID(),
      type: 'image',
      imageUrl: sanitizeUrl(block.imageUrl || ''),
      alt: sanitizeSingleLineText(block.alt || '', LIMITS.shortText),
      caption: sanitizeSingleLineText(block.caption || '', LIMITS.caption),
      borderRadius: sanitizeNumber(
        block.borderRadius,
        LIMITS.radiusMin,
        LIMITS.radiusMax,
        20,
      ),
    }
  }

  if (block.type === 'badge') {
    return {
      id: block.id || crypto.randomUUID(),
      type: 'badge',
      text: sanitizeSingleLineText(block.text || 'Badge', LIMITS.badge),
    }
  }

  if (block.type === 'spacer') {
    return {
      id: block.id || crypto.randomUUID(),
      type: 'spacer',
      height: sanitizeNumber(
        block.height,
        LIMITS.spacerMin,
        LIMITS.spacerMax,
        24,
      ),
    }
  }

  return {
    id: block.id || crypto.randomUUID(),
    type: 'divider',
  }
}

function sanitizePageData(rawPageData) {
  const loadedPageData = rawPageData || defaultPageData
  const loadedSettings = loadedPageData.settings || {}
  const loadedBackground = loadedSettings.background || {}

  return {
    ...defaultPageData,
    ...loadedPageData,
    settings: {
      ...defaultPageData.settings,
      ...loadedSettings,
      accentColor: normalizeHexColor(loadedSettings.accentColor, '#5ECFCF'),
      redirectUrl: sanitizeUrl(loadedSettings.redirectUrl || ''),
      background: {
        type: sanitizeBackgroundType(loadedBackground.type || 'color'),
        value: normalizeHexColor(loadedBackground.value, '#0A1F1F'),
        gradientFrom: normalizeHexColor(loadedBackground.gradientFrom, '#0A1F1F'),
        gradientTo: normalizeHexColor(loadedBackground.gradientTo, '#123B3B'),
        gradientDirection: sanitizeGradientDirection(
          loadedBackground.gradientDirection || '135deg',
        ),
      },
    },
    navbar: {
      ...defaultPageData.navbar,
      ...(loadedPageData.navbar || {}),
      enabled: Boolean(loadedPageData.navbar?.enabled),
      brandText: sanitizeSingleLineText(
        loadedPageData.navbar?.brandText || '',
        LIMITS.brandText,
      ),
      links: (loadedPageData.navbar?.links || []).map(sanitizeNavbarLink),
    },
    sections: (loadedPageData.sections || []).slice(0, LIMITS.sections).map((section, index) => ({
      ...createEmptySection(index, section.columns?.length || 1),
      ...section,
      id: section.id || crypto.randomUUID(),
      name: sanitizeSingleLineText(section.name || `Section ${index + 1}`, LIMITS.sectionName),
      anchorId: sanitizeAnchorId(section.anchorId || ''),
      paddingTop: sanitizeNumber(section.paddingTop, 0, 240, 48),
      paddingBottom: sanitizeNumber(section.paddingBottom, 0, 240, 48),
      paddingSides: sanitizeNumber(section.paddingSides, 0, 120, 24),
      background: {
        type: sanitizeBackgroundType(section.background?.type || 'none', 'none'),
        value: section.background?.type === 'color'
          ? normalizeHexColor(section.background?.value, '')
          : '',
      },
      columns: (section.columns || []).slice(0, 4).map((column) => ({
        id: column.id || crypto.randomUUID(),
        blocks: (column.blocks || [])
          .slice(0, LIMITS.blocksPerColumn)
          .map(sanitizeBlock)
          .filter(Boolean),
      })),
    })),
  }
}

function sanitizeBlockField(block, field, value) {
  if (field === 'content') return sanitizeMultilineText(value, LIMITS.textContent)
  if (field === 'bio') return sanitizeMultilineText(value, LIMITS.bio)
  if (field === 'url' || field === 'imageUrl') return sanitizeUrl(value)
  if (field === 'align') {
    return block.type === 'text' ? sanitizeTextAlign(value) : sanitizeBasicAlign(value)
  }
  if (field === 'layout') return sanitizeSocialLayout(value)
  if (field === 'height') return sanitizeNumber(value, LIMITS.spacerMin, LIMITS.spacerMax, 24)
  if (field === 'borderRadius') return sanitizeNumber(value, LIMITS.radiusMin, LIMITS.radiusMax, 20)
  if (field === 'text') return sanitizeSingleLineText(value, LIMITS.badge)
  if (field === 'caption') return sanitizeSingleLineText(value, LIMITS.caption)
  if (field === 'alt') return sanitizeSingleLineText(value, LIMITS.shortText)
  if (field === 'label' || field === 'sublabel' || field === 'title' || field === 'name') {
    return sanitizeLiveText(value, LIMITS.shortText)
  }

  return sanitizeLiveText(value, LIMITS.shortText)
}

function sanitizeSocialItemField(field, value) {
  if (field === 'platform') return sanitizeSocialPlatform(value)
  if (field === 'url') return sanitizeUrl(value)
  if (field === 'label') return sanitizeLiveText(value, LIMITS.shortText)
  return sanitizeLiveText(value, LIMITS.shortText)
}

function GlitterField({ count = 16 }) {
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

export default function PageEditor() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [qrCode, setQrCode] = useState(null)
  const [codeProfile, setCodeProfile] = useState(null)
  const [pageData, setPageData] = useState(defaultPageData)
  const [uploadingBlockId, setUploadingBlockId] = useState('')
  const [uploadingBlockType, setUploadingBlockType] = useState('')

  const previewUrl = useMemo(() => `/p/${code}`, [code])
  const publicUrl = useMemo(() => getPublicProfileUrl(code), [code])

  useEffect(() => {
    let active = true

    async function loadEditor() {
      if (!user) {
        setLoading(false)
        setError('You need to sign in first.')
        return
      }

      setLoading(true)
      setError('')
      setFeedback('')

      const { qrCode, codeProfile, error } = await getEditableCodeProfileByCode(code, user.id)

      if (!active) return

      if (error) {
        setError(error.message || 'Failed to load editor.')
        setLoading(false)
        return
      }

      if (!qrCode || !codeProfile) {
        setError('This code is not available for editing.')
        setLoading(false)
        return
      }

      if (qrCode.code_type === 'locked') {
        setQrCode(qrCode)
        setCodeProfile(codeProfile)
        setError('Locked codes use official templates and cannot be edited from this page.')
        setLoading(false)
        return
      }

      setQrCode(qrCode)
      setCodeProfile(codeProfile)
      setPageData(sanitizePageData(codeProfile.page_data || defaultPageData))
      setLoading(false)
    }

    loadEditor()

    return () => {
      active = false
    }
  }, [code, user])

  function updateSettings(field, value) {
    setPageData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        [field]: field === 'redirectUrl' ? sanitizeUrl(value) : value,
      },
    }))
  }

  function updateAccentColor(value) {
    setPageData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        accentColor: sanitizeLiveText(value, 20),
      },
    }))
  }

  function updateBackgroundField(field, value) {
    setPageData((prev) => {
      let safeValue = value

      if (field === 'type') safeValue = sanitizeBackgroundType(value)
      if (field === 'value' || field === 'gradientFrom' || field === 'gradientTo') {
        safeValue = sanitizeLiveText(value, 20)
      }
      if (field === 'gradientDirection') safeValue = sanitizeGradientDirection(value)

      return {
        ...prev,
        settings: {
          ...prev.settings,
          background: {
            ...prev.settings.background,
            [field]: safeValue,
          },
        },
      }
    })
  }

  function updateNavbar(field, value) {
    setPageData((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        [field]: field === 'brandText'
          ? sanitizeLiveText(value, LIMITS.brandText)
          : Boolean(value),
      },
    }))
  }

  function addNavbarLink() {
    setPageData((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        links: [...(prev.navbar?.links || []), createNavbarLink()],
      },
    }))
  }

  function updateNavbarLink(linkId, field, value) {
    setPageData((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        links: (prev.navbar?.links || []).map((link) => {
          if (link.id !== linkId) return link

          if (field === 'type') {
            const nextType = sanitizeNavbarLinkType(value)

            return {
              ...link,
              type: nextType,
              url: nextType === 'external' ? link.url || '' : '',
              anchorId: nextType === 'anchor' ? link.anchorId || '' : '',
            }
          }

          if (field === 'label') {
            return { ...link, label: sanitizeLiveText(value, LIMITS.navbarLabel) }
          }

          if (field === 'url') {
            return { ...link, url: sanitizeUrl(value) }
          }

          if (field === 'anchorId') {
            return { ...link, anchorId: sanitizeAnchorId(value) }
          }

          return link
        }),
      },
    }))
  }

  function removeNavbarLink(linkId) {
    setPageData((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        links: (prev.navbar?.links || []).filter((link) => link.id !== linkId),
      },
    }))
  }

  function addSection() {
    if ((pageData.sections || []).length >= LIMITS.sections) {
      setError(`A page can contain up to ${LIMITS.sections} sections.`)
      return
    }

    setPageData((prev) => ({
      ...prev,
      sections: [...prev.sections, createEmptySection(prev.sections.length, 1)],
    }))
  }

  function removeSection(sectionId) {
    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.filter((section) => section.id !== sectionId),
    }))
  }

  function updateSection(sectionId, field, value) {
    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section

        if (field === 'name') {
          return { ...section, name: sanitizeLiveText(value, LIMITS.sectionName) }
        }

        if (field === 'anchorId') {
          return { ...section, anchorId: sanitizeAnchorId(value) }
        }

        return section
      }),
    }))
  }

  function updateSectionColumns(sectionId, newCount) {
    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? resizeSectionColumns(section, newCount) : section,
      ),
    }))
  }

  function addBlock(sectionId, columnId, blockType) {
    if (!BLOCK_TYPES.has(blockType)) return

    const targetSection = pageData.sections.find((section) => section.id === sectionId)
    const targetColumn = targetSection?.columns?.find((column) => column.id === columnId)

    if ((targetColumn?.blocks || []).length >= LIMITS.blocksPerColumn) {
      setError(`Each column can contain up to ${LIMITS.blocksPerColumn} blocks.`)
      return
    }

    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section

        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== columnId) return column

            const newBlock = createBlockByType(blockType)
            if (!newBlock) return column

            return {
              ...column,
              blocks: [...(column.blocks || []), newBlock],
            }
          }),
        }
      }),
    }))
  }

  function updateBlock(sectionId, columnId, blockId, field, value) {
    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section

        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== columnId) return column

            return {
              ...column,
              blocks: column.blocks.map((block) =>
                block.id === blockId
                  ? { ...block, [field]: sanitizeBlockField(block, field, value) }
                  : block,
              ),
            }
          }),
        }
      }),
    }))
  }

  function removeBlock(sectionId, columnId, blockId) {
    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section

        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== columnId) return column

            return {
              ...column,
              blocks: column.blocks.filter((block) => block.id !== blockId),
            }
          }),
        }
      }),
    }))
  }

  function addSocialItem(sectionId, columnId, blockId) {
    const targetSection = pageData.sections.find((section) => section.id === sectionId)
    const targetColumn = targetSection?.columns?.find((column) => column.id === columnId)
    const targetBlock = targetColumn?.blocks?.find((block) => block.id === blockId)

    if ((targetBlock?.items || []).length >= LIMITS.socialsItems) {
      setError(`A socials block can contain up to ${LIMITS.socialsItems} items.`)
      return
    }

    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section

        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== columnId) return column

            return {
              ...column,
              blocks: column.blocks.map((block) => {
                if (block.id !== blockId) return block

                return {
                  ...block,
                  items: [...(block.items || []), createSocialItem()],
                }
              }),
            }
          }),
        }
      }),
    }))
  }

  function updateSocialItem(sectionId, columnId, blockId, itemId, field, value) {
    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section

        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== columnId) return column

            return {
              ...column,
              blocks: column.blocks.map((block) => {
                if (block.id !== blockId) return block

                return {
                  ...block,
                  items: (block.items || []).map((item) =>
                    item.id === itemId
                      ? { ...item, [field]: sanitizeSocialItemField(field, value) }
                      : item,
                  ),
                }
              }),
            }
          }),
        }
      }),
    }))
  }

  function removeSocialItem(sectionId, columnId, blockId, itemId) {
    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section

        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== columnId) return column

            return {
              ...column,
              blocks: column.blocks.map((block) => {
                if (block.id !== blockId) return block

                return {
                  ...block,
                  items: (block.items || []).filter((item) => item.id !== itemId),
                }
              }),
            }
          }),
        }
      }),
    }))
  }

  async function handleUploadImage(sectionId, columnId, block, file) {
    if (!file) return

    setUploadingBlockId(block.id)
    setUploadingBlockType(block.type)
    setError('')
    setFeedback('')

    const folder = block.type === 'avatar' ? 'avatars' : 'images'
    const { data, error } = await uploadImageToAvatars(file, folder)

    setUploadingBlockId('')
    setUploadingBlockType('')

    if (error) {
      setError(error.message || 'Image upload failed.')
      return
    }

    if (!data?.publicUrl) {
      setError('Could not get uploaded image URL.')
      return
    }

    updateBlock(sectionId, columnId, block.id, 'imageUrl', data.publicUrl)
    setFeedback('Image uploaded successfully.')
  }

  async function handleSave() {
    if (!codeProfile || qrCode?.code_type === 'locked') return

    setError('')
    setFeedback('')

    const cleanedPageData = sanitizePageData(pageData)
    const unsafeUrlError = findUnsafeUrl(cleanedPageData)

    if (unsafeUrlError) {
      setError(unsafeUrlError)
      return
    }

    setSaving(true)

    const allBlocks =
      cleanedPageData.sections?.flatMap(
        (section) => section.columns?.flatMap((column) => column.blocks || []) || [],
      ) || []

    const firstAvatarBlock = allBlocks.find((block) => block.type === 'avatar') || null

    const cleanedAvatarName =
      firstAvatarBlock?.name && firstAvatarBlock.name !== 'Your Name'
        ? sanitizeSingleLineText(firstAvatarBlock.name, LIMITS.shortText)
        : ''

    const cleanedAvatarBio =
      firstAvatarBlock?.bio && firstAvatarBlock.bio !== 'Short bio goes here.'
        ? sanitizeMultilineText(firstAvatarBlock.bio, LIMITS.bio)
        : ''

    const cleanedProfileName =
      codeProfile.full_name && codeProfile.full_name !== 'Your Name'
        ? sanitizeSingleLineText(codeProfile.full_name, LIMITS.shortText)
        : ''

    const cleanedProfileBio =
      codeProfile.bio && codeProfile.bio !== 'Short bio goes here.'
        ? sanitizeMultilineText(codeProfile.bio, LIMITS.bio)
        : ''

    const fallbackAvatarUrl = hasUnsafeProtocol(codeProfile.avatar_url)
      ? ''
      : sanitizeUrl(codeProfile.avatar_url || '')

    const derivedFullName = cleanedAvatarName || cleanedProfileName || ''
    const derivedBio = cleanedAvatarBio || cleanedProfileBio || ''
    const derivedAvatarUrl = firstAvatarBlock?.imageUrl || fallbackAvatarUrl || ''

    const { data, error } = await saveCodeProfilePageData(codeProfile.id, cleanedPageData, {
      full_name: derivedFullName,
      bio: derivedBio,
      avatar_url: derivedAvatarUrl,
      accent: cleanedPageData.settings?.accentColor || '#5ECFCF',
    })

    setSaving(false)

    if (error) {
      setError(error.message || 'Failed to save page.')
      return
    }

    setCodeProfile(data)
    setPageData(cleanedPageData)
    setFeedback('Page saved successfully.')
  }

  function renderBlockEditor(sectionId, columnId, block) {
    if (block.type === 'text') {
      return (
        <div className="grid gap-3">
          <textarea
            className="field min-h-[120px]"
            value={block.content || ''}
            maxLength={LIMITS.textContent}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'content', e.target.value)}
            placeholder="Write your text..."
          />
          <select
            className="field"
            value={block.align || 'left'}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'align', e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </select>
        </div>
      )
    }

    if (block.type === 'link') {
      return (
        <div className="grid gap-3">
          <input
            type="text"
            className="field"
            value={block.label || ''}
            maxLength={LIMITS.shortText}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'label', e.target.value)}
            placeholder="Button label"
          />
          <input
            type="text"
            className="field"
            value={block.url || ''}
            maxLength={LIMITS.url}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'url', e.target.value)}
            placeholder="https://example.com or www.example.com"
          />
          <input
            type="text"
            className="field"
            value={block.sublabel || ''}
            maxLength={LIMITS.shortText}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'sublabel', e.target.value)}
            placeholder="Optional sublabel"
          />
        </div>
      )
    }

    if (block.type === 'socials') {
      return (
        <div className="grid gap-4">
          <input
            type="text"
            className="field"
            value={block.title || ''}
            maxLength={LIMITS.shortText}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'title', e.target.value)}
            placeholder="Block title"
          />

          <select
            className="field"
            value={block.layout || 'list'}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'layout', e.target.value)}
          >
            <option value="list">List</option>
            <option value="grid">Grid</option>
          </select>

          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => addSocialItem(sectionId, columnId, block.id)}
          >
            Add Social Item
          </button>

          <div className="grid gap-3">
            {(block.items || []).map((item) => (
              <div
                key={item.id}
                className="editor-social-item-shell rounded-[14px] border border-[rgba(94,207,207,0.10)] bg-[rgba(255,255,255,0.02)] p-3"
              >
                <div className="mb-3 flex items-center justify-between">
                  <div className="text-sm font-semibold text-[#5ECFCF]">Social Item</div>
                  <button
                    type="button"
                    className="text-sm text-white/55 hover:text-white"
                    onClick={() => removeSocialItem(sectionId, columnId, block.id, item.id)}
                  >
                    Remove
                  </button>
                </div>

                <div className="grid gap-3">
                  <select
                    className="field"
                    value={item.platform || 'instagram'}
                    onChange={(e) =>
                      updateSocialItem(
                        sectionId,
                        columnId,
                        block.id,
                        item.id,
                        'platform',
                        e.target.value,
                      )
                    }
                  >
                    <option value="instagram">Instagram</option>
                    <option value="tiktok">TikTok</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="youtube">YouTube</option>
                    <option value="twitter">X / Twitter</option>
                    <option value="github">GitHub</option>
                    <option value="spotify">Spotify</option>
                    <option value="facebook">Facebook</option>
                    <option value="discord">Discord</option>
                    <option value="website">Website</option>
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                  </select>

                  <input
                    type="text"
                    className="field"
                    value={item.label || ''}
                    maxLength={LIMITS.shortText}
                    onChange={(e) =>
                      updateSocialItem(
                        sectionId,
                        columnId,
                        block.id,
                        item.id,
                        'label',
                        e.target.value,
                      )
                    }
                    placeholder="Label"
                  />

                  <input
                    type="text"
                    className="field"
                    value={item.url || ''}
                    maxLength={LIMITS.url}
                    onChange={(e) =>
                      updateSocialItem(
                        sectionId,
                        columnId,
                        block.id,
                        item.id,
                        'url',
                        e.target.value,
                      )
                    }
                    placeholder="https://... or @username or email/phone"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )
    }

    if (block.type === 'spacer') {
      return (
        <input
          type="number"
          className="field"
          min={LIMITS.spacerMin}
          max={LIMITS.spacerMax}
          value={block.height || 24}
          onChange={(e) =>
            updateBlock(sectionId, columnId, block.id, 'height', Number(e.target.value || 24))
          }
          placeholder="Height in px"
        />
      )
    }

    if (block.type === 'divider') {
      return <div className="text-sm text-white/55">Divider block does not need extra settings.</div>
    }

    if (block.type === 'avatar') {
      return (
        <div className="grid gap-3">
          <input
            type="text"
            className="field"
            value={block.imageUrl || ''}
            maxLength={LIMITS.url}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'imageUrl', e.target.value)}
            placeholder="Avatar image URL"
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Upload Avatar</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="field"
              onChange={(e) =>
                handleUploadImage(sectionId, columnId, block, e.target.files?.[0])
              }
            />
          </label>

          {uploadingBlockId === block.id && uploadingBlockType === 'avatar' ? (
            <div className="text-sm text-white/55">Uploading avatar...</div>
          ) : null}

          <input
            type="text"
            className="field"
            value={block.name || ''}
            maxLength={LIMITS.shortText}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'name', e.target.value)}
            placeholder="Display name"
          />
          <textarea
            className="field min-h-[100px]"
            value={block.bio || ''}
            maxLength={LIMITS.bio}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'bio', e.target.value)}
            placeholder="Short bio"
          />
          <select
            className="field"
            value={block.align || 'left'}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'align', e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
          </select>
        </div>
      )
    }

    if (block.type === 'image') {
      return (
        <div className="grid gap-3">
          <input
            type="text"
            className="field"
            value={block.imageUrl || ''}
            maxLength={LIMITS.url}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'imageUrl', e.target.value)}
            placeholder="Image URL"
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Upload Image</span>
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="field"
              onChange={(e) =>
                handleUploadImage(sectionId, columnId, block, e.target.files?.[0])
              }
            />
          </label>

          {uploadingBlockId === block.id && uploadingBlockType === 'image' ? (
            <div className="text-sm text-white/55">Uploading image...</div>
          ) : null}

          <input
            type="text"
            className="field"
            value={block.alt || ''}
            maxLength={LIMITS.shortText}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'alt', e.target.value)}
            placeholder="Alt text"
          />
          <input
            type="text"
            className="field"
            value={block.caption || ''}
            maxLength={LIMITS.caption}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'caption', e.target.value)}
            placeholder="Optional caption"
          />
          <input
            type="number"
            className="field"
            min={LIMITS.radiusMin}
            max={LIMITS.radiusMax}
            value={block.borderRadius ?? 20}
            onChange={(e) =>
              updateBlock(sectionId, columnId, block.id, 'borderRadius', Number(e.target.value || 0))
            }
            placeholder="Border radius"
          />
        </div>
      )
    }

    if (block.type === 'badge') {
      return (
        <input
          type="text"
          className="field"
          value={block.text || ''}
          maxLength={LIMITS.badge}
          onChange={(e) => updateBlock(sectionId, columnId, block.id, 'text', e.target.value)}
          placeholder="Badge text"
        />
      )
    }

    return null
  }

  function getColumnGridClass(count) {
    if (count === 2) return 'md:grid-cols-2'
    if (count === 3) return 'md:grid-cols-2 xl:grid-cols-3'
    if (count === 4) return 'md:grid-cols-2 xl:grid-cols-4'
    return 'grid-cols-1'
  }

  if (loading) {
    return (
      <div className="editor-page min-h-screen bg-[#0A1F1F] text-white flex items-center justify-center">
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="editor-bg-orb editor-bg-orb-1" />
        <div className="editor-bg-orb editor-bg-orb-2" />
        <div className="editor-bg-orb editor-bg-orb-3" />
        <GlitterField count={14} />

        <motion.div
          className="surface-card p-8"
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.35 }}
        >
          <div className="eyebrow mb-4">Editor</div>
          <h1 className="section-title mb-2">Loading editor...</h1>
          <p className="muted">Preparing your page builder workspace.</p>
        </motion.div>
      </div>
    )
  }

  if (error && !codeProfile) {
    return (
      <div className="editor-page min-h-screen bg-[#0A1F1F] px-4 py-8 text-white">
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="ambient-line ambient-line-1" />
        <div className="ambient-line ambient-line-2" />
        <div className="editor-bg-orb editor-bg-orb-1" />
        <div className="editor-bg-orb editor-bg-orb-2" />
        <div className="editor-bg-orb editor-bg-orb-3" />
        <div className="hero-ring hero-ring-1" />
        <div className="hero-ring hero-ring-2" />
        <GlitterField count={16} />

        <div className="container max-w-3xl">
          <motion.div
            className="surface-card p-8 text-center"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35 }}
          >
            <div className="eyebrow mb-4">Editor</div>
            <h1 className="section-title mb-4">Could not open editor</h1>
            <p className="muted mb-6">{error}</p>
            <Link to="/dashboard" className="btn btn-primary glow-btn">
              Back to Dashboard
            </Link>
          </motion.div>
        </div>
      </div>
    )
  }

  if (qrCode?.code_type === 'locked') {
    return (
      <div className="editor-page min-h-screen bg-[#0A1F1F] px-4 py-8 text-white">
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="ambient-line ambient-line-1" />
        <div className="ambient-line ambient-line-2" />
        <div className="editor-bg-orb editor-bg-orb-1" />
        <div className="editor-bg-orb editor-bg-orb-2" />
        <div className="editor-bg-orb editor-bg-orb-3" />
        <div className="hero-ring hero-ring-1" />
        <div className="hero-ring hero-ring-2" />
        <GlitterField count={16} />

        <div className="container max-w-3xl">
          <motion.div
            className="surface-card p-8 text-center"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.35 }}
          >
            <div className="eyebrow mb-4">Locked code</div>
            <h1 className="section-title mb-4">This page cannot be edited here</h1>
            <p className="muted mb-6">
              Locked codes use official template-based content. Users can access the live
              experience, but only admin-managed templates control what appears publicly.
            </p>

            <div className="mb-6 flex flex-wrap justify-center gap-3">
              <button
                type="button"
                onClick={() => navigate(previewUrl)}
                className="btn btn-primary glow-btn"
              >
                Preview Live Page
              </button>
              <Link to="/dashboard" className="btn btn-secondary">
                Back to Dashboard
              </Link>
            </div>

            <div className="rounded-[18px] border border-[rgba(94,207,207,0.14)] bg-[rgba(94,207,207,0.08)] p-4 text-sm text-white/75">
              Public URL: <span className="break-all">{publicUrl}</span>
            </div>
          </motion.div>
        </div>
      </div>
    )
  }

  const accentColor = pageData.settings?.accentColor || '#5ECFCF'
  const bg = pageData.settings?.background || {}
  const bgType = bg.type || 'color'

  const previewBackground =
    bgType === 'gradient'
      ? `linear-gradient(${bg.gradientDirection || '135deg'}, ${bg.gradientFrom || '#0A1F1F'}, ${bg.gradientTo || '#123B3B'})`
      : bg.value || '#0A1F1F'

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
      <GlitterField count={18} />

      <div className="container">
        <motion.div
          className="editor-hero-card surface-card p-6 md:p-8 mb-6"
          variants={heroStagger}
          initial="hidden"
          animate="visible"
        >
          <div className="editor-card-glow" />
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="editor-hero-copy">
              <motion.div variants={fadeUp} transition={{ duration: 0.45 }}>
                <div className="eyebrow mb-3">Page builder</div>
              </motion.div>
              <motion.h1
                className="section-title mb-2"
                variants={fadeUp}
                transition={{ duration: 0.5 }}
              >
                Edit {qrCode?.label || qrCode?.code || 'Profile'}
              </motion.h1>
              <motion.p
                className="muted"
                variants={fadeUp}
                transition={{ duration: 0.45 }}
              >
                This is an open code. You can customize the public page for this activated item.
              </motion.p>
            </div>

            <motion.div
              className="flex flex-wrap gap-3"
              variants={fadeUp}
              transition={{ duration: 0.45 }}
            >
              <Link to="/dashboard" className="btn btn-secondary">
                Back
              </Link>
              <button
                type="button"
                onClick={() => navigate(previewUrl)}
                className="btn btn-ghost"
              >
                Preview
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="btn btn-primary glow-btn"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Page'}
              </button>
            </motion.div>
          </div>
        </motion.div>

        {feedback ? (
          <div className="editor-feedback editor-feedback-success mb-5">
            {feedback}
          </div>
        ) : null}

        {error && codeProfile ? (
          <div className="editor-feedback editor-feedback-error mb-5">
            {error}
          </div>
        ) : null}

        <div className="editor-open-code-banner mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-white/80">
          Open code: this public page is editable by the owner after activation.
        </div>

        <div className="editor-public-url-banner mb-6 rounded-2xl border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/70">
          Public URL: <span className="break-all">{publicUrl}</span>
        </div>

        <motion.div
          className="editor-preview-style mb-6 rounded-[24px] border border-[rgba(94,207,207,0.12)] p-6"
          style={{ background: previewBackground }}
          variants={fadeUp}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.4 }}
        >
          <div className="mb-2 text-sm uppercase tracking-[0.14em] text-[#5ECFCF]">Live style preview</div>
          <div className="text-3xl font-bold" style={{ color: accentColor }}>
            {qrCode?.label || 'Your profile style'}
          </div>
          <div className="mt-2 text-white/70">
            This preview shows your current accent and background settings.
          </div>
        </motion.div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <motion.div
            className="editor-sidebar-wrap grid gap-6"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.4 }}
          >
            <div className="surface-card h-fit p-6">
              <div className="mb-6">
                <div className="eyebrow mb-3">Page settings</div>
                <h2 className="display text-2xl font-bold">Global settings</h2>
              </div>

              <div className="grid gap-5">
                <div>
                  <label className="mb-2 block text-sm font-medium">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={normalizeHexColor(accentColor, '#5ECFCF')}
                      onChange={(e) => updateAccentColor(e.target.value)}
                      className="h-12 w-16 rounded border-0 bg-transparent p-0"
                    />
                    <input
                      type="text"
                      className="field"
                      value={accentColor}
                      maxLength={20}
                      onChange={(e) => updateAccentColor(e.target.value)}
                      placeholder="#5ECFCF"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Background Type</label>
                  <select
                    className="field"
                    value={bgType}
                    onChange={(e) => updateBackgroundField('type', e.target.value)}
                  >
                    <option value="color">Solid Color</option>
                    <option value="gradient">Gradient</option>
                  </select>
                </div>

                {bgType === 'color' ? (
                  <div>
                    <label className="mb-2 block text-sm font-medium">Background Color</label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={normalizeHexColor(bg.value, '#0A1F1F')}
                        onChange={(e) => updateBackgroundField('value', e.target.value)}
                        className="h-12 w-16 rounded border-0 bg-transparent p-0"
                      />
                      <input
                        type="text"
                        className="field"
                        value={bg.value || '#0A1F1F'}
                        maxLength={20}
                        onChange={(e) => updateBackgroundField('value', e.target.value)}
                        placeholder="#0A1F1F"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="grid gap-4">
                    <div>
                      <label className="mb-2 block text-sm font-medium">Gradient From</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={normalizeHexColor(bg.gradientFrom, '#0A1F1F')}
                          onChange={(e) => updateBackgroundField('gradientFrom', e.target.value)}
                          className="h-12 w-16 rounded border-0 bg-transparent p-0"
                        />
                        <input
                          type="text"
                          className="field"
                          value={bg.gradientFrom || '#0A1F1F'}
                          maxLength={20}
                          onChange={(e) => updateBackgroundField('gradientFrom', e.target.value)}
                          placeholder="#0A1F1F"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Gradient To</label>
                      <div className="flex items-center gap-3">
                        <input
                          type="color"
                          value={normalizeHexColor(bg.gradientTo, '#123B3B')}
                          onChange={(e) => updateBackgroundField('gradientTo', e.target.value)}
                          className="h-12 w-16 rounded border-0 bg-transparent p-0"
                        />
                        <input
                          type="text"
                          className="field"
                          value={bg.gradientTo || '#123B3B'}
                          maxLength={20}
                          onChange={(e) => updateBackgroundField('gradientTo', e.target.value)}
                          placeholder="#123B3B"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Gradient Direction</label>
                      <select
                        className="field"
                        value={bg.gradientDirection || '135deg'}
                        onChange={(e) =>
                          updateBackgroundField('gradientDirection', e.target.value)
                        }
                      >
                        <option value="90deg">Left to Right</option>
                        <option value="180deg">Top to Bottom</option>
                        <option value="135deg">Diagonal</option>
                        <option value="45deg">Reverse Diagonal</option>
                      </select>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-2 block text-sm font-medium">Redirect URL</label>
                  <input
                    type="text"
                    className="field"
                    value={pageData.settings?.redirectUrl || ''}
                    maxLength={LIMITS.url}
                    onChange={(e) => updateSettings('redirectUrl', e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <button type="button" onClick={addSection} className="btn btn-primary glow-btn w-full">
                  Add Section
                </button>
              </div>
            </div>

            <div className="surface-card h-fit p-6">
              <div className="mb-6">
                <div className="eyebrow mb-3">Navigation bar</div>
                <h2 className="display text-2xl font-bold">Sticky navbar</h2>
              </div>

              <div className="grid gap-4">
                <label className="flex items-center gap-3 text-sm text-white/80">
                  <input
                    type="checkbox"
                    checked={Boolean(pageData.navbar?.enabled)}
                    onChange={(e) => updateNavbar('enabled', e.target.checked)}
                  />
                  <span>Enable navbar</span>
                </label>

                <div>
                  <label className="mb-2 block text-sm font-medium">Brand Text</label>
                  <input
                    type="text"
                    className="field"
                    value={pageData.navbar?.brandText || ''}
                    maxLength={LIMITS.brandText}
                    onChange={(e) => updateNavbar('brandText', e.target.value)}
                    placeholder="Dresscode"
                  />
                </div>

                <button type="button" onClick={addNavbarLink} className="btn btn-ghost w-full">
                  Add Navbar Link
                </button>

                <div className="grid gap-3">
                  {(pageData.navbar?.links || []).length === 0 ? (
                    <div className="rounded-[14px] border border-[rgba(94,207,207,0.08)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/50">
                      No navbar links yet.
                    </div>
                  ) : null}

                  {(pageData.navbar?.links || []).map((link) => (
                    <div
                      key={link.id}
                      className="editor-navbar-link-shell rounded-[16px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5ECFCF]">
                          Link
                        </div>
                        <button
                          type="button"
                          onClick={() => removeNavbarLink(link.id)}
                          className="text-sm text-white/55 hover:text-white"
                        >
                          Remove
                        </button>
                      </div>

                      <div className="grid gap-3">
                        <input
                          type="text"
                          className="field"
                          value={link.label || ''}
                          maxLength={LIMITS.navbarLabel}
                          onChange={(e) => updateNavbarLink(link.id, 'label', e.target.value)}
                          placeholder="Link label"
                        />

                        <select
                          className="field"
                          value={link.type || 'anchor'}
                          onChange={(e) => updateNavbarLink(link.id, 'type', e.target.value)}
                        >
                          <option value="anchor">Section Anchor</option>
                          <option value="external">External URL</option>
                        </select>

                        {link.type === 'external' ? (
                          <input
                            type="text"
                            className="field"
                            value={link.url || ''}
                            maxLength={LIMITS.url}
                            onChange={(e) => updateNavbarLink(link.id, 'url', e.target.value)}
                            placeholder="https://example.com or www.example.com"
                          />
                        ) : (
                          <input
                            type="text"
                            className="field"
                            value={link.anchorId || ''}
                            maxLength={LIMITS.anchorId}
                            onChange={(e) => updateNavbarLink(link.id, 'anchorId', e.target.value)}
                            placeholder="Anchor ID, e.g. links"
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            className="editor-main-wrap grid gap-5"
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ duration: 0.45, delay: 0.05 }}
          >
            {pageData.sections.length === 0 ? (
              <div className="surface-card p-8">
                <div className="eyebrow mb-4">Sections</div>
                <h2 className="display mb-3 text-3xl font-bold">No sections yet</h2>
                <p className="muted mb-6">
                  Add your first section to start building this page.
                </p>
                <button type="button" onClick={addSection} className="btn btn-primary glow-btn">
                  Add First Section
                </button>
              </div>
            ) : null}

            {pageData.sections.map((section, index) => (
              <motion.div
                key={section.id}
                className="editor-section-shell surface-card p-6"
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.08 }}
                transition={{ duration: 0.35, delay: index * 0.02 }}
              >
                <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="eyebrow mb-3">Section {index + 1}</div>
                    <h3 className="display text-2xl font-bold">{section.name}</h3>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeSection(section.id)}
                    className="btn btn-secondary"
                  >
                    Remove Section
                  </button>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Section Name</label>
                    <input
                      type="text"
                      className="field"
                      value={section.name}
                      maxLength={LIMITS.sectionName}
                      onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Anchor ID</label>
                    <input
                      type="text"
                      className="field"
                      value={section.anchorId}
                      maxLength={LIMITS.anchorId}
                      onChange={(e) => updateSection(section.id, 'anchorId', e.target.value)}
                      placeholder="links"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium">Columns</label>
                    <select
                      className="field"
                      value={section.columns?.length || 1}
                      onChange={(e) => updateSectionColumns(section.id, Number(e.target.value))}
                    >
                      <option value={1}>1 Column</option>
                      <option value={2}>2 Columns</option>
                      <option value={3}>3 Columns</option>
                      <option value={4}>4 Columns</option>
                    </select>
                  </div>
                </div>

                <div className={`mt-6 grid gap-4 ${getColumnGridClass(section.columns?.length || 1)}`}>
                  {(section.columns || []).map((column, columnIndex) => (
                    <div
                      key={column.id}
                      className="editor-column-shell rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4"
                    >
                      <div className="mb-4">
                        <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5ECFCF]">
                          Column {columnIndex + 1}
                        </div>
                      </div>

                      <div className="mb-4 flex flex-wrap gap-2">
                        {['avatar', 'text', 'link', 'socials', 'image', 'badge', 'divider', 'spacer'].map((type) => (
                          <button
                            key={type}
                            type="button"
                            className="btn btn-ghost"
                            onClick={() => addBlock(section.id, column.id, type)}
                          >
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </button>
                        ))}
                      </div>

                      <div className="grid gap-4">
                        {(column.blocks || []).length === 0 ? (
                          <div className="rounded-[14px] border border-[rgba(94,207,207,0.08)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/50">
                            No blocks in this column yet.
                          </div>
                        ) : null}

                        {(column.blocks || []).map((block) => (
                          <div
                            key={block.id}
                            className="editor-block-shell rounded-[16px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4"
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5ECFCF]">
                                {block.type}
                              </div>
                              <button
                                type="button"
                                onClick={() => removeBlock(section.id, column.id, block.id)}
                                className="text-sm text-white/55 hover:text-white"
                              >
                                Remove
                              </button>
                            </div>

                            {renderBlockEditor(section.id, column.id, block)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  )
}
