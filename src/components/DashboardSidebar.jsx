export default function DashboardSidebar({
  profile,
  activeTab,
  onChangeTab,
}) {
  const role = profile?.role || 'user'

  const userTabs = [
    { key: 'my-codes', label: 'My Codes', hint: 'Activate, edit, and open your codes' },
    { key: 'analytics', label: 'Analytics', hint: 'See scans and activity' },
    { key: 'account', label: 'Account', hint: 'Manage your profile settings' },
  ]

  const journalistTabs = [
    { key: 'my-codes', label: 'My Codes', hint: 'Activate, edit, and open your codes' },
    { key: 'analytics', label: 'Analytics', hint: 'See scans and activity' },
    { key: 'journal', label: 'Journal', hint: 'Write and manage articles' },
    { key: 'account', label: 'My Profile', hint: 'Manage your profile settings' },
  ]

  const adminTabs = [
    { key: 'qr-codes', label: 'QR Codes', hint: 'Create and manage platform codes' },
    { key: 'shop-products', label: 'Shop Products', hint: 'Manage products, collectibles, and images' },
    { key: 'templates', label: 'Templates', hint: 'Control locked official experiences' },
    { key: 'users', label: 'Users', hint: 'Manage roles, assignments, and access' },
    { key: 'journal', label: 'Journal', hint: 'Manage articles and publishing' },
    { key: 'my-codes', label: 'My Codes', hint: 'See codes from the user side' },
    { key: 'analytics', label: 'Analytics', hint: 'Review scan activity' },
    { key: 'account', label: 'My Profile', hint: 'Manage your own profile settings' },
  ]

  const tabs =
    role === 'admin'
      ? adminTabs
      : role === 'journalist'
        ? journalistTabs
        : userTabs

  function getRoleDescription() {
    if (role === 'admin') {
      return 'You manage codes, templates, users, shop products, and official platform content.'
    }

    if (role === 'journalist') {
      return 'You manage your codes, view analytics, and publish journal content.'
    }

    return 'You can activate codes, edit open profiles, and view official locked experiences.'
  }

  return (
    <aside className="surface-card h-fit p-4 md:p-5">
      <div className="mb-6">
        <div className="eyebrow mb-3">Dashboard</div>
        <h2 className="display text-2xl font-bold">{profile?.full_name || 'User'}</h2>
        <p className="mt-2 text-sm text-white/55 capitalize">{role}</p>
        <p className="mt-3 text-sm leading-7 text-white/60">
          {getRoleDescription()}
        </p>
      </div>

      <div className="grid gap-2">
        {tabs.map((tab) => {
          const active = activeTab === tab.key

          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onChangeTab(tab.key)}
              className={`w-full rounded-2xl px-4 py-3 text-left transition ${
                active
                  ? 'bg-[#5ECFCF] text-[#071515]'
                  : 'border border-[rgba(94,207,207,0.08)] bg-[rgba(255,255,255,0.02)] text-white/78 hover:border-[rgba(94,207,207,0.2)] hover:text-white'
              }`}
            >
              <div className="text-sm font-medium">{tab.label}</div>
              <div
                className={`mt-1 text-xs leading-5 ${
                  active ? 'text-[#071515]/80' : 'text-white/50'
                }`}
              >
                {tab.hint}
              </div>
            </button>
          )
        })}
      </div>
    </aside>
  )
}
