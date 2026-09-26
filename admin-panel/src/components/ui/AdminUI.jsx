import { useEffect } from 'react'
import {
  AlertCircle,
  CheckCircle2,
  LoaderCircle,
  Search,
  X,
} from 'lucide-react'

export function StatCard({ title, value, subtitle, badge, icon: Icon, tone = 'coffee', loading = false }) {
  const toneStyles = {
    coffee: {
      iconBg: 'bg-[#6F4E37]/10 text-[#6F4E37]',
      borderLeft: 'border-l-[#6F4E37]',
    },
    accent: {
      iconBg: 'bg-[#C98A5B]/15 text-[#6F4E37]',
      borderLeft: 'border-l-[#C98A5B]',
    },
    success: {
      iconBg: 'bg-[#4F8A5A]/12 text-[#4F8A5A]',
      borderLeft: 'border-l-[#4F8A5A]',
    },
    dark: {
      iconBg: 'bg-[#2B2118]/10 text-[#2B2118]',
      borderLeft: 'border-l-[#2B2118]',
    },
    danger: {
      iconBg: 'bg-[#C75C5C]/12 text-[#C75C5C]',
      borderLeft: 'border-l-[#C75C5C]',
    },
  }

  const currentTone = toneStyles[tone] || toneStyles.coffee

  return (
    <div className={`card border-l-4 ${currentTone.borderLeft} flex items-start justify-between gap-4 p-5 hover:shadow-md transition-all duration-150`}>
      <div className="min-w-0 flex-1">
        <p className="text-[11px] font-bold uppercase tracking-wider text-[#81766D]">
          {title}
        </p>
        {loading ? (
          <div className="mt-2 h-8 w-24 animate-pulse rounded-lg bg-[#F7F5F2]" />
        ) : (
          <div className="mt-1.5 flex items-baseline gap-2.5 flex-wrap">
            <p className="text-2xl font-extrabold tracking-tight text-[#241B15]">
              {value}
            </p>
            {badge && (
              <span className="rounded-full bg-[#4F8A5A]/10 border border-[#4F8A5A]/25 px-2 py-0.5 text-[11px] font-bold text-[#4F8A5A]">
                {badge}
              </span>
            )}
          </div>
        )}
        {subtitle && (
          <p className="mt-1 text-xs text-[#81766D] truncate">{subtitle}</p>
        )}
      </div>

      {Icon && (
        <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${currentTone.iconBg}`}>
          <Icon size={20} />
        </div>
      )}
    </div>
  )
}

export function StatusBadge({ status, label }) {
  const normalized = String(status || '').toLowerCase()
  const styles = {
    active: 'badge-success',
    live: 'badge-success',
    paid: 'badge-success',
    completed: 'badge-success',
    suspended: 'badge-danger',
    disabled: 'badge-danger',
    cancelled: 'badge-danger',
    pending: 'badge-warning',
    warning: 'badge-warning',
    trial: 'badge-neutral',
    basic: 'badge-warning',
    pro: 'badge-coffee',
  }

  const dotColors = {
    active: 'bg-[#4F8A5A]',
    live: 'bg-[#4F8A5A]',
    paid: 'bg-[#4F8A5A]',
    completed: 'bg-[#4F8A5A]',
    suspended: 'bg-[#C75C5C]',
    disabled: 'bg-[#C75C5C]',
    cancelled: 'bg-[#C75C5C]',
    pending: 'bg-[#D99A5B]',
    warning: 'bg-[#D99A5B]',
    trial: 'bg-[#81766D]',
    basic: 'bg-[#D99A5B]',
    pro: 'bg-[#6F4E37]',
  }

  const badgeClass = styles[normalized] || 'badge-neutral'
  const dotClass = dotColors[normalized] || 'bg-[#81766D]'

  return (
    <span className={badgeClass}>
      <span className={`h-1.5 w-1.5 rounded-full ${dotClass}`} />
      <span className="capitalize">{label || status}</span>
    </span>
  )
}

export function SearchBar({ value, onChange, placeholder = 'Search...', className = '' }) {
  return (
    <div className={`relative ${className}`}>
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="input-field pl-10 pr-8 py-2 text-xs sm:text-sm"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-md p-0.5 text-[#81766D] hover:bg-[#E8E1DA]/50 hover:text-[#241B15]"
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}

export function Modal({ open, onClose, title, subtitle, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#241B15]/50 p-4 backdrop-blur-xs">
      <div
        className={`w-full ${maxWidth} max-h-[90vh] overflow-y-auto rounded-2xl border border-[#E8E1DA] bg-white p-6 shadow-xl`}
      >
        <div className="mb-5 flex items-start justify-between gap-4 border-b border-[#F7F5F2] pb-4">
          <div>
            <h2 className="text-lg font-bold text-[#241B15]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[#81766D]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#81766D] transition-colors hover:bg-[#F7F5F2] hover:text-[#241B15]"
          >
            <X size={18} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

export function Drawer({ open, onClose, title, subtitle, children, width = 'max-w-lg' }) {
  useEffect(() => {
    if (!open) return undefined
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose?.()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [open, onClose])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[#241B15]/45 backdrop-blur-xs">
      <div className="fixed inset-0" onClick={onClose} />
      <div
        className={`relative z-10 flex h-full w-full ${width} flex-col border-l border-[#E8E1DA] bg-white shadow-xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E8E1DA] px-6 py-5">
          <div>
            <h2 className="text-lg font-bold text-[#241B15]">{title}</h2>
            {subtitle && <p className="mt-0.5 text-xs text-[#81766D]">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#81766D] transition-colors hover:bg-[#F7F5F2] hover:text-[#241B15]"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-6">{children}</div>
      </div>
    </div>
  )
}

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  loading = false,
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#241B15]/50 p-4 backdrop-blur-xs">
      <div className="w-full max-w-sm rounded-2xl border border-[#E8E1DA] bg-white p-6 shadow-xl">
        <h3 className="text-base font-bold text-[#241B15]">{title}</h3>
        {description && (
          <p className="mt-2 text-sm leading-relaxed text-[#81766D]">{description}</p>
        )}
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="btn-secondary text-xs px-4 py-2"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className={
              variant === 'danger'
                ? 'btn-danger text-xs px-4 py-2'
                : 'btn-primary text-xs px-4 py-2'
            }
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}

export function EmptyState({ icon: Icon, title, description, actionLabel, onAction }) {
  return (
    <div className="flex min-h-[260px] flex-col items-center justify-center rounded-2xl border border-dashed border-[#E8E1DA] bg-white p-8 text-center">
      {Icon && (
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#F7F5F2] text-[#6F4E37]">
          <Icon size={24} />
        </div>
      )}
      <h3 className="text-base font-bold text-[#241B15]">{title}</h3>
      {description && (
        <p className="mt-1 max-w-sm text-xs leading-relaxed text-[#81766D]">
          {description}
        </p>
      )}
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className="btn-primary mt-4 text-xs px-4 py-2"
        >
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function LoadingState({ message = 'Loading data...', rows = 3 }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2.5 text-xs font-medium text-[#81766D]">
        <LoaderCircle size={16} className="animate-spin text-[#6F4E37]" />
        <span>{message}</span>
      </div>
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className="h-20 w-full animate-pulse rounded-2xl border border-[#E8E1DA] bg-white/80 p-5"
          >
            <div className="h-3.5 w-1/3 rounded bg-[#F7F5F2]" />
            <div className="mt-2.5 h-3 w-1/2 rounded bg-[#F7F5F2]" />
          </div>
        ))}
      </div>
    </div>
  )
}

export function Toast({ message, type = 'success', onClose }) {
  useEffect(() => {
    if (!message) return undefined
    const timer = window.setTimeout(() => onClose?.(), 4000)
    return () => window.clearTimeout(timer)
  }, [message, onClose])

  if (!message) return null

  const isError = type === 'error'

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl border border-[#E8E1DA] bg-[#2B2118] px-4 py-3 text-xs font-semibold text-white shadow-xl">
      {isError ? (
        <AlertCircle size={16} className="text-[#C75C5C] shrink-0" />
      ) : (
        <CheckCircle2 size={16} className="text-[#4F8A5A] shrink-0" />
      )}
      <span>{message}</span>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-2 rounded p-0.5 text-white/60 hover:text-white"
        >
          <X size={14} />
        </button>
      )}
    </div>
  )
}
