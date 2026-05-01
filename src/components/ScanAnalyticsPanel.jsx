import { useEffect, useMemo, useState } from 'react'
import {
  getRecentScansForUserCodes,
  getScanBreakdownForUserCodes,
} from '../lib/dashboard'
import { useAuth } from '../context/AuthContext'

function formatDateTime(value) {
  if (!value) return 'Unknown time'

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown time'

  return date.toLocaleString()
}

function formatShortDate(value) {
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  })
}

function getDateKey(date) {
  return date.toISOString().slice(0, 10)
}

function buildDailyScanSeries(scans, days = 7) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(today)
    date.setDate(today.getDate() - (days - 1 - index))

    return {
      key: getDateKey(date),
      label: formatShortDate(date),
      scans: 0,
    }
  })

  const bucketMap = new Map(buckets.map((item) => [item.key, item]))

  for (const scan of scans || []) {
    if (!scan?.scanned_at) continue

    const scannedAt = new Date(scan.scanned_at)
    if (Number.isNaN(scannedAt.getTime())) continue

    scannedAt.setHours(0, 0, 0, 0)

    const key = getDateKey(scannedAt)
    const bucket = bucketMap.get(key)

    if (bucket) {
      bucket.scans += 1
    }
  }

  return buckets
}

function MetricCard({ label, value, hint }) {
  return (
    <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-5">
      <div className="text-sm text-white/55">{label}</div>
      <div className="mt-2 text-3xl font-bold text-[#5ECFCF]">{value}</div>
      {hint ? <div className="mt-2 text-sm leading-6 text-white/55">{hint}</div> : null}
    </div>
  )
}

function DailyScanChart({ data }) {
  const width = 720
  const height = 280
  const paddingX = 34
  const paddingTop = 28
  const paddingBottom = 52
  const chartHeight = height - paddingTop - paddingBottom
  const maxValue = Math.max(1, ...data.map((item) => item.scans))
  const barSlot = (width - paddingX * 2) / Math.max(1, data.length)
  const barWidth = Math.min(42, Math.max(18, barSlot * 0.42))

  return (
    <div className="overflow-hidden rounded-[22px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4">
      <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="eyebrow mb-2">Scan graph</div>
          <h3 className="display text-2xl font-bold">Last 7 days</h3>
        </div>
        <div className="text-sm text-white/50">Daily scan volume from your active codes</div>
      </div>

      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Daily QR scan graph"
        className="h-auto w-full"
      >
        <defs>
          <linearGradient id="scanBarGradient" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#5ECFCF" stopOpacity="0.95" />
            <stop offset="100%" stopColor="#5ECFCF" stopOpacity="0.22" />
          </linearGradient>
          <filter id="scanGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const y = paddingTop + chartHeight * ratio
          return (
            <line
              key={ratio}
              x1={paddingX}
              x2={width - paddingX}
              y1={y}
              y2={y}
              stroke="rgba(255,255,255,0.08)"
              strokeWidth="1"
            />
          )
        })}

        {data.map((item, index) => {
          const x = paddingX + barSlot * index + barSlot / 2
          const barHeight = item.scans === 0 ? 3 : (item.scans / maxValue) * chartHeight
          const y = paddingTop + chartHeight - barHeight

          return (
            <g key={item.key}>
              <rect
                x={x - barWidth / 2}
                y={y}
                width={barWidth}
                height={barHeight}
                rx="10"
                fill="url(#scanBarGradient)"
                filter={item.scans > 0 ? 'url(#scanGlow)' : undefined}
              />

              <circle
                cx={x}
                cy={y}
                r={item.scans > 0 ? 4 : 2.5}
                fill={item.scans > 0 ? '#5ECFCF' : 'rgba(255,255,255,0.24)'}
              />

              <text
                x={x}
                y={paddingTop + chartHeight + 24}
                textAnchor="middle"
                fill="rgba(255,255,255,0.58)"
                fontSize="13"
              >
                {item.label}
              </text>

              <text
                x={x}
                y={Math.max(18, y - 10)}
                textAnchor="middle"
                fill={item.scans > 0 ? '#5ECFCF' : 'rgba(255,255,255,0.36)'}
                fontSize="13"
                fontWeight="700"
              >
                {item.scans}
              </text>
            </g>
          )
        })}
      </svg>
    </div>
  )
}

function TopCodeBars({ breakdown }) {
  const topItems = breakdown.slice(0, 5)
  const maxScans = Math.max(1, ...topItems.map((item) => Number(item.scans) || 0))

  if (!topItems.length) {
    return (
      <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/55">
        No scan breakdown available yet.
      </div>
    )
  }

  return (
    <div className="grid gap-4">
      {topItems.map((item, index) => {
        const scanCount = Number(item.scans) || 0
        const widthPercent = Math.max(4, (scanCount / maxScans) * 100)

        return (
          <div
            key={item.qr_code_id || item.code || index}
            className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4"
          >
            <div className="mb-3 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="font-semibold text-white">
                  {item.label || item.code || 'Untitled code'}
                </div>
                <div className="mt-1 break-all text-xs text-white/45">{item.code}</div>
              </div>
              <div className="shrink-0 text-xl font-bold text-[#5ECFCF]">{scanCount}</div>
            </div>

            <div className="h-3 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full bg-[#5ECFCF] shadow-[0_0_18px_rgba(94,207,207,0.35)]"
                style={{ width: `${widthPercent}%` }}
              />
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default function ScanAnalyticsPanel() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [recentScans, setRecentScans] = useState([])
  const [breakdown, setBreakdown] = useState([])

  useEffect(() => {
    let active = true

    if (!user) {
      setLoading(false)
      return () => {
        active = false
      }
    }

    async function load() {
      setLoading(true)
      setError('')

      const [{ data: scans, error: scansError }, { data: stats, error: statsError }] =
        await Promise.all([
          getRecentScansForUserCodes(user.id, 100),
          getScanBreakdownForUserCodes(user.id),
        ])

      if (!active) return

      if (scansError || statsError) {
        setError(
          scansError?.message ||
            statsError?.message ||
            'Could not load scan analytics.',
        )
      }

      setRecentScans(scans || [])
      setBreakdown(stats || [])
      setLoading(false)
    }

    load()

    return () => {
      active = false
    }
  }, [user])

  const dailySeries = useMemo(() => buildDailyScanSeries(recentScans, 7), [recentScans])

  const totalScans = useMemo(
    () => breakdown.reduce((sum, item) => sum + (Number(item.scans) || 0), 0),
    [breakdown],
  )

  const scannedCodes = useMemo(
    () => breakdown.filter((item) => Number(item.scans) > 0).length,
    [breakdown],
  )

  const topCode = breakdown.find((item) => Number(item.scans) > 0)

  if (loading) {
    return (
      <div className="surface-card p-6">
        <div className="eyebrow mb-3">Analytics</div>
        <h2 className="display mb-2 text-2xl font-bold">Loading scan analytics...</h2>
        <p className="muted">Preparing scan graph and recent activity.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6">
      <div className="surface-card p-6">
        <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="eyebrow mb-3">Analytics</div>
            <h2 className="display text-3xl font-bold">Scan performance</h2>
            <p className="muted mt-2">
              Review QR scan activity, top-performing codes, and recent live events.
            </p>
          </div>

          <div className="badge self-start lg:self-auto">Owner analytics</div>
        </div>

        {error ? (
          <div className="mb-5 rounded-[18px] border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
            {error}
          </div>
        ) : null}

        <div className="mb-6 grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Total scans"
            value={totalScans}
            hint="All scans recorded across your activated codes."
          />
          <MetricCard
            label="Scanned codes"
            value={scannedCodes}
            hint="Codes that have received at least one scan."
          />
          <MetricCard
            label="Top code"
            value={topCode ? Number(topCode.scans) || 0 : 0}
            hint={topCode ? topCode.label || topCode.code : 'No top code yet.'}
          />
        </div>

        <DailyScanChart data={dailySeries} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr_0.95fr]">
        <div className="surface-card p-6">
          <div className="eyebrow mb-3">Top QR Codes</div>
          <h2 className="display mb-4 text-2xl font-bold">Code breakdown</h2>

          {breakdown.length === 0 ? (
            <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/55">
              No scans yet.
            </div>
          ) : (
            <TopCodeBars breakdown={breakdown} />
          )}
        </div>

        <div className="surface-card p-6">
          <div className="eyebrow mb-3">Live activity</div>
          <h2 className="display mb-4 text-2xl font-bold">Recent Scans</h2>

          {recentScans.length === 0 ? (
            <div className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] p-4 text-sm text-white/55">
              No scans recorded yet.
            </div>
          ) : (
            <div className="grid max-h-[560px] gap-3 overflow-y-auto pr-2">
              {recentScans.slice(0, 30).map((scan, index) => (
                <div
                  key={scan.id || `${scan.scanned_at}-${index}`}
                  className="rounded-[18px] border border-[rgba(94,207,207,0.12)] bg-[rgba(255,255,255,0.02)] px-4 py-3 text-sm"
                >
                  <div className="font-semibold">
                    {scan.qr_code?.label || scan.qr_code?.code || 'Unknown QR'}
                  </div>

                  <div className="mt-1 text-xs text-white/50">
                    {formatDateTime(scan.scanned_at)}
                  </div>

                  {scan.device ? (
                    <div className="mt-2 line-clamp-2 break-all text-xs text-white/35">
                      {scan.device}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
