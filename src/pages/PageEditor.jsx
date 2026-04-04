import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
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

gsap.registerPlugin(ScrollTrigger)

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

function isValidHexColor(value) {
  return /^#([0-9A-Fa-f]{6})$/.test(value)
}

function normalizeHexColor(value, fallback) {
  if (!value) return fallback
  const trimmed = value.trim()
  return isValidHexColor(trimmed) ? trimmed : fallback
}

export default function PageEditor() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const rootRef = useRef(null)

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
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (prefersReducedMotion) return undefined

    const cleanupFns = []

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.editor-hero-copy > *',
        { opacity: 0, y: 34 },
        {
          opacity: 1,
          y: 0,
          duration: 0.85,
          stagger: 0.08,
          ease: 'power3.out',
        }
      )

      gsap.fromTo(
        '.editor-sidebar-wrap',
        { opacity: 0, x: -24 },
        {
          opacity: 1,
          x: 0,
          duration: 0.82,
          ease: 'power3.out',
          delay: 0.08,
        }
      )

      gsap.fromTo(
        '.editor-main-wrap',
        { opacity: 0, y: 28, scale: 0.985 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: 0.92,
          ease: 'power3.out',
          delay: 0.12,
        }
      )

      gsap.utils.toArray('.reveal-up').forEach((el, i) => {
        gsap.fromTo(
          el,
          { opacity: 0, y: 38 },
          {
            opacity: 1,
            y: 0,
            duration: 0.78,
            delay: i * 0.02,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 86%',
            },
          }
        )
      })

      gsap.utils.toArray('.reveal-scale').forEach((el) => {
        gsap.fromTo(
          el,
          { opacity: 0, scale: 0.95 },
          {
            opacity: 1,
            scale: 1,
            duration: 0.75,
            ease: 'power3.out',
            scrollTrigger: {
              trigger: el,
              start: 'top 88%',
            },
          }
        )
      })

      gsap.to('.pulse-grid', {
        backgroundPosition: '220% 220%',
        duration: 22,
        repeat: -1,
        ease: 'none',
      })

      gsap.to('.editor-bg-orb-1', {
        y: 22,
        x: 12,
        duration: 6.6,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.editor-bg-orb-2', {
        y: -18,
        x: -12,
        duration: 7.4,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.to('.editor-bg-orb-3', {
        y: 14,
        x: 10,
        duration: 8.1,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      })

      gsap.utils.toArray('.float-card').forEach((el, i) => {
        gsap.to(el, {
          y: i % 2 === 0 ? -8 : 8,
          duration: 3.6 + i * 0.25,
          repeat: -1,
          yoyo: true,
          ease: 'sine.inOut',
        })
      })

      gsap.utils.toArray('.tilt-card').forEach((card) => {
        const inner = card.querySelector('.tilt-inner')
        if (!inner) return

        const handleMove = (e) => {
          const rect = card.getBoundingClientRect()
          const x = e.clientX - rect.left
          const y = e.clientY - rect.top
          const rotateY = ((x / rect.width) - 0.5) * 8
          const rotateX = -((y / rect.height) - 0.5) * 8

          gsap.to(inner, {
            rotateX,
            rotateY,
            transformPerspective: 900,
            transformOrigin: 'center',
            duration: 0.3,
            ease: 'power2.out',
          })

          gsap.to(card, {
            '--spotlight-x': `${x}px`,
            '--spotlight-y': `${y}px`,
            duration: 0.22,
            ease: 'power2.out',
          })
        }

        const handleLeave = () => {
          gsap.to(inner, {
            rotateX: 0,
            rotateY: 0,
            duration: 0.45,
            ease: 'power3.out',
          })
        }

        card.addEventListener('mousemove', handleMove)
        card.addEventListener('mouseleave', handleLeave)

        cleanupFns.push(() => {
          card.removeEventListener('mousemove', handleMove)
          card.removeEventListener('mouseleave', handleLeave)
        })
      })

      gsap.utils.toArray('.magnetic-btn').forEach((btn) => {
        const handleMove = (e) => {
          const rect = btn.getBoundingClientRect()
          const x = e.clientX - rect.left - rect.width / 2
          const y = e.clientY - rect.top - rect.height / 2

          gsap.to(btn, {
            x: x * 0.11,
            y: y * 0.11,
            duration: 0.28,
            ease: 'power3.out',
          })
        }

        const handleLeave = () => {
          gsap.to(btn, {
            x: 0,
            y: 0,
            duration: 0.45,
            ease: 'elastic.out(1, 0.45)',
          })
        }

        btn.addEventListener('mousemove', handleMove)
        btn.addEventListener('mouseleave', handleLeave)

        cleanupFns.push(() => {
          btn.removeEventListener('mousemove', handleMove)
          btn.removeEventListener('mouseleave', handleLeave)
        })
      })
    }, rootRef)

    return () => {
      cleanupFns.forEach((fn) => fn())
      ctx.revert()
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill())
    }
  }, [])

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

      const loadedPageData = codeProfile.page_data || defaultPageData

      setQrCode(qrCode)
      setCodeProfile(codeProfile)
      setPageData({
        ...defaultPageData,
        ...loadedPageData,
        settings: {
          ...defaultPageData.settings,
          ...(loadedPageData.settings || {}),
          background: {
            type: loadedPageData.settings?.background?.type || 'color',
            value: loadedPageData.settings?.background?.value || '#0A1F1F',
            gradientFrom: loadedPageData.settings?.background?.gradientFrom || '#0A1F1F',
            gradientTo: loadedPageData.settings?.background?.gradientTo || '#123B3B',
            gradientDirection:
              loadedPageData.settings?.background?.gradientDirection || '135deg',
          },
        },
        navbar: {
          ...defaultPageData.navbar,
          ...(loadedPageData.navbar || {}),
          links: (loadedPageData.navbar?.links || []).map((link) => ({
            id: link.id || crypto.randomUUID(),
            label: link.label || 'Link',
            type: link.type || (link.url ? 'external' : 'anchor'),
            anchorId: link.anchorId || '',
            url: link.url || '',
          })),
        },
        sections: (loadedPageData.sections || []).map((section, index) => ({
          ...createEmptySection(index, section.columns?.length || 1),
          ...section,
          columns: (section.columns || []).map((column) => ({
            id: column.id || crypto.randomUUID(),
            blocks: (column.blocks || []).map((block) => ({
              ...block,
              id: block.id || crypto.randomUUID(),
              items:
                block.type === 'socials'
                  ? (block.items || []).map((item) => ({
                      id: item.id || crypto.randomUUID(),
                      platform: item.platform || 'instagram',
                      label: item.label || 'Social',
                      url: item.url || '',
                    }))
                  : block.items,
            })),
          })),
        })),
      })
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
        [field]: value,
      },
    }))
  }

  function updateAccentColor(value) {
    setPageData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        accentColor: value,
      },
    }))
  }

  function updateBackgroundField(field, value) {
    setPageData((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        background: {
          ...prev.settings.background,
          [field]: value,
        },
      },
    }))
  }

  function updateNavbar(field, value) {
    setPageData((prev) => ({
      ...prev,
      navbar: {
        ...prev.navbar,
        [field]: value,
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
        links: (prev.navbar?.links || []).map((link) =>
          link.id === linkId ? { ...link, [field]: value } : link
        ),
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
      sections: prev.sections.map((section) =>
        section.id === sectionId ? { ...section, [field]: value } : section
      ),
    }))
  }

  function updateSectionColumns(sectionId, newCount) {
    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) =>
        section.id === sectionId ? resizeSectionColumns(section, newCount) : section
      ),
    }))
  }

  function addBlock(sectionId, columnId, blockType) {
    setPageData((prev) => ({
      ...prev,
      sections: prev.sections.map((section) => {
        if (section.id !== sectionId) return section

        return {
          ...section,
          columns: section.columns.map((column) => {
            if (column.id !== columnId) return column

            const newBlock = createBlockByType(blockType)

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
                block.id === blockId ? { ...block, [field]: value } : block
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
                    item.id === itemId ? { ...item, [field]: value } : item
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

    setSaving(true)
    setError('')
    setFeedback('')

    const cleanedPageData = {
      ...pageData,
      settings: {
        ...pageData.settings,
        accentColor: normalizeHexColor(pageData.settings?.accentColor, '#5ECFCF'),
        background: {
          ...pageData.settings.background,
          type: pageData.settings?.background?.type || 'color',
          value: normalizeHexColor(pageData.settings?.background?.value, '#0A1F1F'),
          gradientFrom: normalizeHexColor(
            pageData.settings?.background?.gradientFrom,
            '#0A1F1F'
          ),
          gradientTo: normalizeHexColor(
            pageData.settings?.background?.gradientTo,
            '#123B3B'
          ),
          gradientDirection:
            pageData.settings?.background?.gradientDirection || '135deg',
        },
      },
    }

    const allBlocks =
      cleanedPageData.sections?.flatMap(
        (section) => section.columns?.flatMap((column) => column.blocks || []) || []
      ) || []

    const firstAvatarBlock = allBlocks.find((block) => block.type === 'avatar') || null

    const cleanedAvatarName =
      firstAvatarBlock?.name && firstAvatarBlock.name !== 'Your Name'
        ? firstAvatarBlock.name
        : ''

    const cleanedAvatarBio =
      firstAvatarBlock?.bio && firstAvatarBlock.bio !== 'Short bio goes here.'
        ? firstAvatarBlock.bio
        : ''

    const cleanedProfileName =
      codeProfile.full_name && codeProfile.full_name !== 'Your Name'
        ? codeProfile.full_name
        : ''

    const cleanedProfileBio =
      codeProfile.bio && codeProfile.bio !== 'Short bio goes here.'
        ? codeProfile.bio
        : ''

    const derivedFullName = cleanedAvatarName || cleanedProfileName || ''
    const derivedBio = cleanedAvatarBio || cleanedProfileBio || ''
    const derivedAvatarUrl = firstAvatarBlock?.imageUrl || codeProfile.avatar_url || ''

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
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'label', e.target.value)}
            placeholder="Button label"
          />
          <input
            type="text"
            className="field"
            value={block.url || ''}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'url', e.target.value)}
            placeholder="https://example.com or www.example.com"
          />
          <input
            type="text"
            className="field"
            value={block.sublabel || ''}
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
            className="btn btn-ghost magnetic-btn"
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
                        e.target.value
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
                    onChange={(e) =>
                      updateSocialItem(
                        sectionId,
                        columnId,
                        block.id,
                        item.id,
                        'label',
                        e.target.value
                      )
                    }
                    placeholder="Label"
                  />

                  <input
                    type="text"
                    className="field"
                    value={item.url || ''}
                    onChange={(e) =>
                      updateSocialItem(
                        sectionId,
                        columnId,
                        block.id,
                        item.id,
                        'url',
                        e.target.value
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
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'imageUrl', e.target.value)}
            placeholder="Avatar image URL"
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Upload Avatar</span>
            <input
              type="file"
              accept="image/*"
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
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'name', e.target.value)}
            placeholder="Display name"
          />
          <textarea
            className="field min-h-[100px]"
            value={block.bio || ''}
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
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'imageUrl', e.target.value)}
            placeholder="Image URL"
          />

          <label className="block">
            <span className="mb-2 block text-sm font-medium">Upload Image</span>
            <input
              type="file"
              accept="image/*"
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
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'alt', e.target.value)}
            placeholder="Alt text"
          />
          <input
            type="text"
            className="field"
            value={block.caption || ''}
            onChange={(e) => updateBlock(sectionId, columnId, block.id, 'caption', e.target.value)}
            placeholder="Optional caption"
          />
          <input
            type="number"
            className="field"
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
      <div
        ref={rootRef}
        className="editor-page min-h-screen bg-[#0A1F1F] text-white flex items-center justify-center"
      >
        <div className="page-noise" />
        <div className="pulse-grid" />
        <div className="editor-bg-orb editor-bg-orb-1" />
        <div className="editor-bg-orb editor-bg-orb-2" />
        <div className="editor-bg-orb editor-bg-orb-3" />
        <GlitterField count={14} />

        <div className="surface-card p-8 tilt-card reveal-scale">
          <div className="tilt-inner">
            <div className="eyebrow mb-4">Editor</div>
            <h1 className="section-title mb-2">Loading editor...</h1>
            <p className="muted">Preparing your page builder workspace.</p>
          </div>
        </div>
      </div>
    )
  }

  if (error && !codeProfile) {
    return (
      <div ref={rootRef} className="editor-page min-h-screen bg-[#0A1F1F] px-4 py-8 text-white">
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
          <div className="surface-card p-8 text-center tilt-card reveal-scale">
            <div className="tilt-inner">
              <div className="eyebrow mb-4">Editor</div>
              <h1 className="section-title mb-4">Could not open editor</h1>
              <p className="muted mb-6">{error}</p>
              <Link to="/dashboard" className="btn btn-primary glow-btn magnetic-btn">
                Back to Dashboard
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (qrCode?.code_type === 'locked') {
    return (
      <div ref={rootRef} className="editor-page min-h-screen bg-[#0A1F1F] px-4 py-8 text-white">
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
          <div className="surface-card p-8 text-center tilt-card reveal-scale">
            <div className="tilt-inner">
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
                  className="btn btn-primary glow-btn magnetic-btn"
                >
                  Preview Live Page
                </button>
                <Link to="/dashboard" className="btn btn-secondary magnetic-btn">
                  Back to Dashboard
                </Link>
              </div>

              <div className="rounded-[18px] border border-[rgba(94,207,207,0.14)] bg-[rgba(94,207,207,0.08)] p-4 text-sm text-white/75">
                Public URL: <span className="break-all">{publicUrl}</span>
              </div>
            </div>
          </div>
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
    <div ref={rootRef} className="app-shell editor-page min-h-screen bg-[#0A1F1F] px-4 py-8 text-white">
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
        <div className="editor-hero-card surface-card tilt-card p-6 md:p-8 mb-6">
          <div className="tilt-inner editor-hero-copy">
            <div className="editor-card-glow" />
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="eyebrow mb-3">Page builder</div>
                <h1 className="section-title mb-2">
                  Edit {qrCode?.label || qrCode?.code || 'Profile'}
                </h1>
                <p className="muted">
                  This is an open code. You can customize the public page for this activated item.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to="/dashboard" className="btn btn-secondary magnetic-btn">
                  Back
                </Link>
                <button
                  type="button"
                  onClick={() => navigate(previewUrl)}
                  className="btn btn-ghost magnetic-btn"
                >
                  Preview
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  className="btn btn-primary glow-btn magnetic-btn"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Page'}
                </button>
              </div>
            </div>
          </div>
        </div>

        {feedback ? (
          <div className="editor-feedback editor-feedback-success mb-5 reveal-up">
            {feedback}
          </div>
        ) : null}

        {error && codeProfile ? (
          <div className="editor-feedback editor-feedback-error mb-5 reveal-up">
            {error}
          </div>
        ) : null}

        <div className="editor-open-code-banner mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-white/80 reveal-up">
          Open code: this public page is editable by the owner after activation.
        </div>

        <div className="editor-public-url-banner mb-6 rounded-2xl border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/70 reveal-up">
          Public URL: <span className="break-all">{publicUrl}</span>
        </div>

        <div
          className="editor-preview-style mb-6 rounded-[24px] border border-[rgba(94,207,207,0.12)] p-6 tilt-card reveal-scale"
          style={{ background: previewBackground }}
        >
          <div className="tilt-inner">
            <div className="mb-2 text-sm uppercase tracking-[0.14em] text-[#5ECFCF]">Live style preview</div>
            <div className="text-3xl font-bold" style={{ color: accentColor }}>
              {qrCode?.label || 'Your profile style'}
            </div>
            <div className="mt-2 text-white/70">
              This preview shows your current accent and background settings.
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
          <div className="editor-sidebar-wrap grid gap-6">
            <div className="surface-card h-fit p-6 tilt-card reveal-scale">
              <div className="tilt-inner">
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
                      onChange={(e) => updateSettings('redirectUrl', e.target.value)}
                      placeholder="https://example.com"
                    />
                  </div>

                  <button type="button" onClick={addSection} className="btn btn-primary glow-btn magnetic-btn w-full">
                    Add Section
                  </button>
                </div>
              </div>
            </div>

            <div className="surface-card h-fit p-6 tilt-card reveal-scale">
              <div className="tilt-inner">
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
                      onChange={(e) => updateNavbar('brandText', e.target.value)}
                      placeholder="Dresscode"
                    />
                  </div>

                  <button type="button" onClick={addNavbarLink} className="btn btn-ghost magnetic-btn w-full">
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
                              onChange={(e) => updateNavbarLink(link.id, 'url', e.target.value)}
                              placeholder="https://example.com or www.example.com"
                            />
                          ) : (
                            <input
                              type="text"
                              className="field"
                              value={link.anchorId || ''}
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
            </div>
          </div>

          <div className="editor-main-wrap grid gap-5">
            {pageData.sections.length === 0 ? (
              <div className="surface-card p-8 tilt-card reveal-scale">
                <div className="tilt-inner">
                  <div className="eyebrow mb-4">Sections</div>
                  <h2 className="display mb-3 text-3xl font-bold">No sections yet</h2>
                  <p className="muted mb-6">
                    Add your first section to start building this page.
                  </p>
                  <button type="button" onClick={addSection} className="btn btn-primary glow-btn magnetic-btn">
                    Add First Section
                  </button>
                </div>
              </div>
            ) : null}

            {pageData.sections.map((section, index) => (
              <div key={section.id} className="editor-section-shell surface-card p-6 tilt-card reveal-up">
                <div className="tilt-inner">
                  <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                    <div>
                      <div className="eyebrow mb-3">Section {index + 1}</div>
                      <h3 className="display text-2xl font-bold">{section.name}</h3>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="btn btn-secondary magnetic-btn"
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
                        onChange={(e) => updateSection(section.id, 'name', e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-medium">Anchor ID</label>
                      <input
                        type="text"
                        className="field"
                        value={section.anchorId}
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
                        className="editor-column-shell rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 float-card"
                      >
                        <div className="mb-4">
                          <div className="text-sm font-semibold uppercase tracking-[0.14em] text-[#5ECFCF]">
                            Column {columnIndex + 1}
                          </div>
                        </div>

                        <div className="mb-4 flex flex-wrap gap-2">
                          <button type="button" className="btn btn-ghost magnetic-btn" onClick={() => addBlock(section.id, column.id, 'avatar')}>
                            Avatar
                          </button>
                          <button type="button" className="btn btn-ghost magnetic-btn" onClick={() => addBlock(section.id, column.id, 'text')}>
                            Text
                          </button>
                          <button type="button" className="btn btn-ghost magnetic-btn" onClick={() => addBlock(section.id, column.id, 'link')}>
                            Link
                          </button>
                          <button type="button" className="btn btn-ghost magnetic-btn" onClick={() => addBlock(section.id, column.id, 'socials')}>
                            Socials
                          </button>
                          <button type="button" className="btn btn-ghost magnetic-btn" onClick={() => addBlock(section.id, column.id, 'image')}>
                            Image
                          </button>
                          <button type="button" className="btn btn-ghost magnetic-btn" onClick={() => addBlock(section.id, column.id, 'badge')}>
                            Badge
                          </button>
                          <button type="button" className="btn btn-ghost magnetic-btn" onClick={() => addBlock(section.id, column.id, 'divider')}>
                            Divider
                          </button>
                          <button type="button" className="btn btn-ghost magnetic-btn" onClick={() => addBlock(section.id, column.id, 'spacer')}>
                            Spacer
                          </button>
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
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
