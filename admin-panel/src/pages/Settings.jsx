import { useState } from 'react'
import {
  Bell,
  CheckCircle2,
  Coffee,
  Globe,
  Lock,
  Palette,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  User,
} from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { StatusBadge, Toast } from '../components/ui/AdminUI.jsx'

const settingsSections = [
  { id: 'general', label: 'General', icon: Globe },
  { id: 'cafe-profile', label: 'Café Profile', icon: Coffee },
  { id: 'account', label: 'Account', icon: User },
  { id: 'security', label: 'Security', icon: Lock },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'appearance', label: 'Appearance', icon: Palette },
]

function Settings() {
  const { admin } = useAdminAuth()
  const [activeTab, setActiveTab] = useState('general')
  const [toast, setToast] = useState('')

  const [prefs, setPrefs] = useState(() => {
    try {
      const saved = localStorage.getItem('admin_console_prefs')
      if (saved) return JSON.parse(saved)
    } catch {
      // ignore
    }
    return {
      platformName: 'Café Management System',
      supportEmail: admin?.email || 'support@cafeplatform.com',
      currency: 'INR (₹)',
      timezone: 'Asia/Kolkata (IST)',
      defaultPlan: 'trial',
      autoApproveSignups: true,
      allowMultiBranch: true,
      notifyNewTenant: true,
      notifySuspendedAlert: true,
      notifyPlanUpgrade: true,
      compactTables: false,
      highContrastBadges: true,
    }
  })

  const handleSave = (e) => {
    e?.preventDefault?.()
    try {
      localStorage.setItem('admin_console_prefs', JSON.stringify(prefs))
    } catch {
      // ignore
    }
    setToast('Settings saved successfully.')
  }

  return (
    <div className="space-y-6">
      <Toast message={toast} type="success" onClose={() => setToast('')} />

      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#6F4E37]/10 text-[#6F4E37]">
            <SettingsIcon size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-[#241B15]">
              Settings &amp; Preferences
            </h1>
            <p className="text-xs text-[#81766D]">
              Configure platform defaults, café onboarding rules, notifications, and appearance
            </p>
          </div>
        </div>

        <button type="button" onClick={handleSave} className="btn-primary self-start sm:self-auto">
          <Save size={15} />
          <span>Save Changes</span>
        </button>
      </div>

      {/* Left Settings Navigation + Right Content */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr]">
        {/* Left Navigation */}
        <aside className="card h-fit p-3">
          <nav className="space-y-1">
            {settingsSections.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-left text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-[#6F4E37] text-white shadow-2xs font-bold'
                      : 'text-[#81766D] hover:bg-[#F7F5F2] hover:text-[#241B15]'
                  }`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Right Main Content */}
        <form onSubmit={handleSave} className="card space-y-6 p-6">
          {activeTab === 'general' && (
            <div className="space-y-5">
              <div className="border-b border-[#F7F5F2] pb-3.5">
                <h2 className="text-base font-bold text-[#241B15]">General Configuration</h2>
                <p className="text-xs text-[#81766D]">
                  Regional formatting, default currency, and operating timezone
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                    Platform Title
                  </label>
                  <input
                    type="text"
                    value={prefs.platformName}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, platformName: e.target.value }))
                    }
                    className="input-field mt-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                    Support Contact Email
                  </label>
                  <input
                    type="email"
                    value={prefs.supportEmail}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, supportEmail: e.target.value }))
                    }
                    className="input-field mt-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                    Default Currency
                  </label>
                  <input
                    type="text"
                    value={prefs.currency}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, currency: e.target.value }))
                    }
                    className="input-field mt-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                    Default Timezone
                  </label>
                  <input
                    type="text"
                    value={prefs.timezone}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, timezone: e.target.value }))
                    }
                    className="input-field mt-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === 'cafe-profile' && (
            <div className="space-y-5">
              <div className="border-b border-[#F7F5F2] pb-3.5">
                <h2 className="text-base font-bold text-[#241B15]">Café Onboarding &amp; Profile Defaults</h2>
                <p className="text-xs text-[#81766D]">
                  Default subscription tier and branch entitlements for newly registered cafés
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Default Onboarding Plan Tier
                </label>
                <select
                  value={prefs.defaultPlan}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, defaultPlan: e.target.value }))
                  }
                  className="input-field mt-1.5 max-w-xs capitalize"
                >
                  <option value="trial">Trial Plan</option>
                  <option value="basic">Basic Plan</option>
                  <option value="pro">Pro Plan</option>
                </select>
              </div>

              <div className="space-y-3 pt-2">
                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                  <div>
                    <p className="text-sm font-bold text-[#241B15]">
                      Auto-Activate New Café Registrations
                    </p>
                    <p className="text-xs text-[#81766D]">
                      Allow newly registered café owners to access their POS immediately
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.autoApproveSignups}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, autoApproveSignups: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#6F4E37]"
                  />
                </label>

                <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                  <div>
                    <p className="text-sm font-bold text-[#241B15]">
                      Multi-Branch Support
                    </p>
                    <p className="text-xs text-[#81766D]">
                      Enable multi-outlet branch management for eligible subscription tiers
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={prefs.allowMultiBranch}
                    onChange={(e) =>
                      setPrefs((p) => ({ ...p, allowMultiBranch: e.target.checked }))
                    }
                    className="h-4 w-4 accent-[#6F4E37]"
                  />
                </label>
              </div>
            </div>
          )}

          {activeTab === 'account' && (
            <div className="space-y-5">
              <div className="border-b border-[#F7F5F2] pb-3.5">
                <h2 className="text-base font-bold text-[#241B15]">Administrator Account</h2>
                <p className="text-xs text-[#81766D]">
                  Your active Super Admin credentials and privilege scope
                </p>
              </div>

              <div className="flex items-center gap-4 rounded-2xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-5">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#6F4E37] text-lg font-extrabold text-white">
                  {admin?.name?.slice(0, 2).toUpperCase() || 'AD'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#241B15]">
                      {admin?.name || 'Super Admin'}
                    </h3>
                    <StatusBadge status="active" label="Verified Admin" />
                  </div>
                  <p className="mt-0.5 text-xs text-[#81766D]">
                    {admin?.email || 'admin@platform.com'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <div className="border-b border-[#F7F5F2] pb-3.5">
                <h2 className="text-base font-bold text-[#241B15]">Security &amp; Access Control</h2>
                <p className="text-xs text-[#81766D]">
                  JWT session protection and tenant isolation status
                </p>
              </div>

              <div className="rounded-2xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-5 space-y-3">
                <div className="flex items-center gap-2.5 text-sm font-bold text-[#241B15]">
                  <ShieldCheck size={18} className="text-[#4F8A5A]" />
                  <span>Role-Based Super Admin Guard Active</span>
                </div>
                <p className="text-xs leading-relaxed text-[#81766D]">
                  All `/super-admin/*` endpoints require a signed Super Admin bearer token. Suspending a café tenant immediately revokes login access for its owner and staff accounts.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <div className="border-b border-[#F7F5F2] pb-3.5">
                <h2 className="text-base font-bold text-[#241B15]">Notification Preferences</h2>
                <p className="text-xs text-[#81766D]">
                  Choose which platform events appear in your top navbar activity feed
                </p>
              </div>

              <div className="space-y-3">
                {[
                  {
                    key: 'notifyNewTenant',
                    title: 'New Café Tenant Registrations',
                    desc: 'Show an alert when a new café owner registers on the platform',
                  },
                  {
                    key: 'notifySuspendedAlert',
                    title: 'Suspended License Warnings',
                    desc: 'Highlight suspended café accounts in the navbar notification bell',
                  },
                  {
                    key: 'notifyPlanUpgrade',
                    title: 'Subscription Tier Changes',
                    desc: 'Confirm whenever a café upgrades or changes subscription plans',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4"
                  >
                    <div>
                      <p className="text-sm font-bold text-[#241B15]">{item.title}</p>
                      <p className="text-xs text-[#81766D]">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={Boolean(prefs[item.key])}
                      onChange={(e) =>
                        setPrefs((p) => ({ ...p, [item.key]: e.target.checked }))
                      }
                      className="h-4 w-4 accent-[#6F4E37]"
                    />
                  </label>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <div className="border-b border-[#F7F5F2] pb-3.5">
                <h2 className="text-base font-bold text-[#241B15]">Appearance &amp; Theme</h2>
                <p className="text-xs text-[#81766D]">
                  Warm Luxury Café SaaS color palette and table density
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {[
                  { name: 'Primary Coffee', hex: '#6F4E37' },
                  { name: 'Dark Espresso', hex: '#2B2118' },
                  { name: 'Warm Accent', hex: '#C98A5B' },
                  { name: 'Cream Canvas', hex: '#F7F5F2' },
                  { name: 'Pure Card', hex: '#FFFFFF' },
                ].map((swatch) => (
                  <div
                    key={swatch.hex}
                    className="rounded-xl border border-[#E8E1DA] p-3 text-center"
                  >
                    <div
                      className="mx-auto h-8 w-full rounded-lg border border-[#E8E1DA]"
                      style={{ backgroundColor: swatch.hex }}
                    />
                    <p className="mt-2 text-xs font-bold text-[#241B15]">{swatch.name}</p>
                    <p className="font-mono text-[10px] text-[#81766D]">{swatch.hex}</p>
                  </div>
                ))}
              </div>

              <label className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/60 p-4">
                <div>
                  <p className="text-sm font-bold text-[#241B15]">High-Contrast Status Badges</p>
                  <p className="text-xs text-[#81766D]">
                    Display status dots inside Active, Suspended, and Plan Tier pills
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={prefs.highContrastBadges}
                  onChange={(e) =>
                    setPrefs((p) => ({ ...p, highContrastBadges: e.target.checked }))
                  }
                  className="h-4 w-4 accent-[#6F4E37]"
                />
              </label>
            </div>
          )}

          <div className="flex items-center justify-end gap-3 border-t border-[#F7F5F2] pt-4">
            <button type="submit" className="btn-primary text-xs px-5 py-2.5">
              <CheckCircle2 size={15} />
              <span>Save Preferences</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default Settings
