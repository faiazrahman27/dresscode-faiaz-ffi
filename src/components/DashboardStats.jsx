export default function DashboardStats({ codesCount, scansCount }) {
  const stats = [
    { label: 'My Codes', value: codesCount },
    { label: 'Total Scans', value: scansCount },
    { label: 'Connections', value: 'Soon' },
    { label: 'Collectibles', value: 'Soon' },
  ]

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {stats.map((item) => (
        <div key={item.label} className="surface-card p-5">
          <div className="metric-value">{item.value}</div>
          <div className="metric-label">{item.label}</div>
        </div>
      ))}
    </div>
  )
}
