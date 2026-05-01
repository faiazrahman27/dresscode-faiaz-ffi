import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import QRCode from 'qrcode'
import { getPublicProfileUrl } from '../lib/site'

export default function MyCodesPanel({ codes, user }) {
  const [copiedCode, setCopiedCode] = useState('')
  const [qrImages, setQrImages] = useState({})
  const navigate = useNavigate()

  useEffect(() => {
    let active = true

    async function buildQrImages() {
      const entries = await Promise.all(
        codes.map(async (code) => {
          const publicUrl = getPublicProfileUrl(code.code)

          try {
            const dataUrl = await QRCode.toDataURL(publicUrl, {
              width: 220,
              margin: 2,
            })
            return [code.id, dataUrl]
          } catch {
            return [code.id, '']
          }
        }),
      )

      if (!active) return
      setQrImages(Object.fromEntries(entries))
    }

    if (codes.length) {
      buildQrImages()
    } else {
      setQrImages({})
    }

    return () => {
      active = false
    }
  }, [codes])

  async function handleCopy(url, codeValue) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedCode(codeValue)
      setTimeout(() => setCopiedCode(''), 1500)
    } catch {
      alert('Could not copy URL.')
    }
  }

  async function handleDownloadPng(codeValue) {
    const target = codes.find((item) => item.code === codeValue)
    if (!target) return

    const dataUrl = qrImages[target.id]
    if (!dataUrl) {
      alert('QR image is not ready yet.')
      return
    }

    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `${codeValue}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  function getStatusBadge({ isAssignedOnly, isActivatedByCurrentUser }) {
    if (isAssignedOnly) {
      return <span className="badge">Assigned</span>
    }

    if (isActivatedByCurrentUser) {
      return <span className="badge">Activated</span>
    }

    return <span className="badge">Pending</span>
  }

  function getPrimaryAction({
    code,
    isAssignedOnly,
    isActivatedByCurrentUser,
    isLocked,
    isOpen,
    publicUrl,
  }) {
    if (isAssignedOnly) {
      return (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/activate/${code.code}`)}
        >
          Activate
        </button>
      )
    }

    if (isActivatedByCurrentUser && isOpen) {
      return (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/editor/${code.code}`)}
        >
          Edit Profile
        </button>
      )
    }

    if (isActivatedByCurrentUser && isLocked) {
      return (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => window.open(publicUrl, '_blank')}
        >
          Open Official Page
        </button>
      )
    }

    if (!code.activated) {
      return (
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => navigate(`/activate/${code.code}`)}
        >
          Activate
        </button>
      )
    }

    return null
  }

  if (!codes.length) {
    return (
      <div className="surface-card p-8">
        <div className="eyebrow mb-4">My Codes</div>
        <h2 className="display mb-3 text-3xl font-bold">No codes yet</h2>
        <p className="muted">
          Activate or receive a Dresscode QR first, then your codes will appear here.
        </p>
      </div>
    )
  }

  return (
    <div className="grid gap-5">
      {codes.map((code) => {
        const publicUrl = getPublicProfileUrl(code.code)
        const qrImage = qrImages[code.id]

        const isActivatedByCurrentUser =
          Boolean(code.activated) && code.activated_by === user?.id

        const isAssignedToCurrentUser =
          Boolean(code.assigned_to_current_user) ||
          (!code.activated && code.assigned_to === user?.id)

        const isAssignedToCurrentEmail = Boolean(code.assigned_to_current_email)

        const hasEmailAssignment = Boolean(code.has_email_assignment)
        const hasUserAssignment =
          Boolean(code.has_user_assignment) || Boolean(code.assigned_to)

        const isAssignedOnly =
          !code.activated && (isAssignedToCurrentUser || isAssignedToCurrentEmail)

        const isLocked = code.code_type === 'locked'
        const isOpen = code.code_type === 'open'

        const statusBadge = getStatusBadge({
          isAssignedOnly,
          isActivatedByCurrentUser,
        })

        const primaryAction = getPrimaryAction({
          code,
          isAssignedOnly,
          isActivatedByCurrentUser,
          isLocked,
          isOpen,
          publicUrl,
        })

        return (
          <div key={code.id} className="surface-card p-6">
            <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="grid gap-5 md:grid-cols-[96px_minmax(0,1fr)] md:items-start">
                <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-[20px] border border-[rgba(94,207,207,0.14)] bg-white p-2">
                  {qrImage ? (
                    <img
                      src={qrImage}
                      alt={`QR for ${code.code}`}
                      className="h-full w-full object-contain"
                    />
                  ) : (
                    <span className="text-xs text-black/50">Loading QR...</span>
                  )}
                </div>

                <div className="min-w-0">
                  <div className="mb-2 flex flex-wrap items-center gap-3">
                    <h3 className="display break-words text-2xl font-bold">
                      {code.label || 'Untitled code'}
                    </h3>

                    {statusBadge}
                    {isLocked ? <span className="badge">Locked</span> : null}
                    {isOpen ? <span className="badge">Open</span> : null}
                  </div>

                  <div className="mb-2 break-all text-sm text-white/55">{code.code}</div>
                  <div className="mb-3 break-all text-sm text-white/65">{publicUrl}</div>

                  {isAssignedToCurrentEmail && !code.activated ? (
                    <div className="mb-3 rounded-[16px] border border-[rgba(94,207,207,0.16)] bg-[rgba(94,207,207,0.08)] p-4 text-sm text-white/80">
                      <div className="mb-1 font-semibold text-white">Reserved for your email</div>
                      <div className="leading-7 text-white/70">
                        This code is reserved for the email on your account. Activate it with
                        the scratch code from the physical item.
                      </div>
                    </div>
                  ) : null}

                  {isAssignedToCurrentUser && !code.activated ? (
                    <div className="mb-3 rounded-[16px] border border-[rgba(94,207,207,0.16)] bg-[rgba(94,207,207,0.08)] p-4 text-sm text-white/80">
                      <div className="mb-1 font-semibold text-white">Reserved for your account</div>
                      <div className="leading-7 text-white/70">
                        This code is reserved for your account. Activate it with the scratch
                        code from the physical item.
                      </div>
                    </div>
                  ) : null}

                  {!isAssignedToCurrentEmail &&
                  !isAssignedToCurrentUser &&
                  !code.activated &&
                  (hasEmailAssignment || hasUserAssignment) ? (
                    <div className="mb-3 rounded-[16px] border border-[rgba(94,207,207,0.16)] bg-[rgba(94,207,207,0.08)] p-4 text-sm text-white/80">
                      <div className="mb-1 font-semibold text-white">Reserved code</div>
                      <div className="leading-7 text-white/70">
                        This code is reserved and must be activated from the assigned account
                        or email.
                      </div>
                    </div>
                  ) : null}

                  {isOpen ? (
                    <div className="rounded-[16px] border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-white/80">
                      <div className="mb-1 font-semibold text-white">Open code</div>
                      <div className="leading-7 text-white/70">
                        This code becomes user-editable after activation. The owner can open
                        the editor, personalize the profile, and update the public page over
                        time.
                      </div>
                    </div>
                  ) : null}

                  {isLocked ? (
                    <div className="rounded-[16px] border border-[rgba(94,207,207,0.16)] bg-[rgba(94,207,207,0.08)] p-4 text-sm text-white/80">
                      <div className="mb-1 font-semibold text-white">Locked code</div>
                      <div className="leading-7 text-white/70">
                        This code opens official template-based content. After activation, the
                        user can access the experience, but the page content stays controlled
                        by admin templates.
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>

              <div className="flex flex-wrap gap-3 xl:flex-col xl:items-stretch">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => handleCopy(publicUrl, code.code)}
                >
                  {copiedCode === code.code ? 'Copied' : 'Copy URL'}
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => handleDownloadPng(code.code)}
                >
                  PNG
                </button>

                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => window.open(publicUrl, '_blank')}
                >
                  View Live
                </button>

                {primaryAction}
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
