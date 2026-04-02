import { useEffect, useState } from 'react'
import {
  getRecentScansForUserCodes,
  getScanBreakdownForUserCodes,
} from '../lib/dashboard'
import { useAuth } from '../context/AuthContext'

export default function ScanAnalyticsPanel() {
  const { user } = useAuth()

  const [loading, setLoading] = useState(true)
  const [recentScans, setRecentScans] = useState([])
  const [breakdown, setBreakdown] = useState([])

  useEffect(() => {
    if (!user) return

    async function load() {
      setLoading(true)

      const { data: scans } = await getRecentScansForUserCodes(user.id)
      const { data: stats } = await getScanBreakdownForUserCodes(user.id)

      setRecentScans(scans || [])
      setBreakdown(stats || [])

      setLoading(false)
    }

    load()
  }, [user])

  if (loading) {
    return <div className="surface-card p-6">Loading scan analytics...</div>
  }

  return (
    <div className="grid gap-6">
      <div className="surface-card p-6">
        <div className="eyebrow mb-3">Analytics</div>
        <h2 className="display text-2xl font-bold mb-4">Top QR Codes</h2>

        {breakdown.length === 0 ? (
          <div className="text-white/60 text-sm">No scans yet.</div>
        ) : (
          <div className="grid gap-3">
            {breakdown.map((item) => (
              <div
                key={item.qr_code_id}
                className="flex justify-between items-center border border-white/10 rounded-xl px-4 py-3"
              >
                <div>
                  <div className="font-semibold">{item.label || item.code}</div>
                  <div className="text-xs text-white/50">{item.code}</div>
                </div>

                <div className="text-lg font-bold text-[#5ECFCF]">{item.scans}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="surface-card p-6">
        <div className="eyebrow mb-3">Live activity</div>
        <h2 className="display text-2xl font-bold mb-4">Recent Scans</h2>

        {recentScans.length === 0 ? (
          <div className="text-white/60 text-sm">No scans recorded yet.</div>
        ) : (
          <div className="grid gap-3">
            {recentScans.map((scan) => (
              <div
                key={scan.id}
                className="border border-white/10 rounded-xl px-4 py-3 text-sm"
              >
                <div className="font-semibold">
                  {scan.qr_code?.label || scan.qr_code?.code || 'Unknown QR'}
                </div>

                <div className="text-white/50 text-xs">
                  {scan.scanned_at
                    ? new Date(scan.scanned_at).toLocaleString()
                    : 'Unknown time'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
