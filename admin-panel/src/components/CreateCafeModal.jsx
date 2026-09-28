import { useEffect, useMemo, useRef, useState } from 'react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  Clock,
  Coffee,
  Eye,
  EyeOff,
  Globe,
  Image as ImageIcon,
  KeyRound,
  Lock,
  Mail,
  MapPin,
  Phone,
  RefreshCw,
  Send,
  Settings,
  ShieldCheck,
  Store,
  Upload,
  User,
  Wand2,
  X,
} from 'lucide-react'
import { sendCafeEmailVerification, verifyCafeEmail } from '../api/adminApi.js'

const defaultCafeForm = {
  // Section 1: Café Information
  cafeName: '',
  logo: '',
  ownerName: '',
  phone: '',
  email: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  plan: 'trial',

  // Section 2: Admin Account
  adminName: '',
  adminEmail: '',
  adminPhone: '',
  temporaryPassword: '',

  // Section 3: Café Settings
  currency: 'INR',
  currencySymbol: '₹',
  taxPercent: 5,
  gstNumber: '',
  openingTime: '09:00',
  closingTime: '23:00',
  timezone: 'Asia/Kolkata',
  allowDineIn: true,
  allowTakeaway: true,
  allowQrOrdering: true,
}

const emptyOtpDigits = ['', '', '', '', '', '']

function generateTempPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'
  let rand = ''
  for (let i = 0; i < 6; i += 1) {
    rand += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `Cafe@${rand}9`
}

function isValidEmailFormat(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim())
}

function getFriendlyErrorMessage(err, fallbackMessage) {
  if (!err?.response) {
    return 'Network error. Please check your connection and try again.'
  }
  return err.response?.data?.message || err.message || fallbackMessage
}

export function CreateCafeModal({
  open,
  onClose,
  onSubmit,
  plans = [],
  loading = false,
  mode = 'create', // 'create' | 'edit'
  initialCafe = null,
}) {
  const [form, setForm] = useState(defaultCafeForm)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [syncAdminWithOwner, setSyncAdminWithOwner] = useState(true)

  // Email Verification State (Create Mode)
  const [emailVerified, setEmailVerified] = useState(false)
  const [verifiedEmailAddress, setVerifiedEmailAddress] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [otpTargetEmail, setOtpTargetEmail] = useState('')
  const [otpDigits, setOtpDigits] = useState(emptyOtpDigits)
  const [sendingOtp, setSendingOtp] = useState(false)
  const [verifyingOtp, setVerifyingOtp] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [otpError, setOtpError] = useState('')
  const [otpSuccess, setOtpSuccess] = useState('')
  const otpInputRefs = useRef([])

  useEffect(() => {
    if (!open) return
    setError('')
    setOtpError('')
    setOtpSuccess('')
    setOtpDigits(emptyOtpDigits)
    setSendingOtp(false)
    setVerifyingOtp(false)
    setResendCooldown(0)

    if (mode === 'edit' && initialCafe) {
      const s = initialCafe.settings || {}
      const existingAdminEmail = (
        initialCafe.admin?.email ||
        initialCafe.owner?.email ||
        initialCafe.email ||
        ''
      )
        .trim()
        .toLowerCase()
      setForm({
        cafeName: initialCafe.name || '',
        logo: initialCafe.logo || '',
        ownerName: initialCafe.ownerName || initialCafe.owner?.name || '',
        phone: initialCafe.phone || initialCafe.owner?.phone || '',
        email: initialCafe.email || initialCafe.owner?.email || '',
        address: initialCafe.address || '',
        city: initialCafe.city || '',
        state: initialCafe.state || '',
        pincode: initialCafe.pincode || '',
        plan: initialCafe.plan || 'trial',
        adminName: initialCafe.admin?.name || initialCafe.owner?.name || '',
        adminEmail: existingAdminEmail,
        adminPhone: initialCafe.admin?.phone || initialCafe.phone || '',
        temporaryPassword: '',
        currency: s.currency || 'INR',
        currencySymbol: s.currencySymbol || '₹',
        taxPercent: s.taxPercent ?? 5,
        gstNumber: s.gstNumber || '',
        openingTime: s.openingTime || '09:00',
        closingTime: s.closingTime || '23:00',
        timezone: s.timezone || 'Asia/Kolkata',
        allowDineIn: s.orderSettings?.allowDineIn ?? true,
        allowTakeaway: s.orderSettings?.allowTakeaway ?? true,
        allowQrOrdering: s.orderSettings?.allowQrOrdering ?? true,
      })
      setSyncAdminWithOwner(false)
      setEmailVerified(true)
      setVerifiedEmailAddress(existingAdminEmail)
      setOtpSent(false)
      setOtpTargetEmail(existingAdminEmail)
    } else {
      setForm(defaultCafeForm)
      setSyncAdminWithOwner(true)
      setEmailVerified(false)
      setVerifiedEmailAddress('')
      setOtpSent(false)
      setOtpTargetEmail('')
    }
  }, [open, mode, initialCafe])

  // 60-second countdown timer for Resend OTP
  useEffect(() => {
    if (resendCooldown <= 0) return undefined
    const timer = setInterval(() => {
      setResendCooldown((prev) => (prev > 1 ? prev - 1 : 0))
    }, 1000)
    return () => clearInterval(timer)
  }, [resendCooldown])

  const effectiveAdminEmail = useMemo(() => {
    const raw = syncAdminWithOwner && mode === 'create' ? form.email : form.adminEmail
    return String(raw || '').trim().toLowerCase()
  }, [form.email, form.adminEmail, syncAdminWithOwner, mode])

  const isCurrentEmailVerified = useMemo(() => {
    if (mode === 'edit') return true
    return (
      Boolean(emailVerified) &&
      Boolean(effectiveAdminEmail) &&
      effectiveAdminEmail === verifiedEmailAddress
    )
  }, [mode, emailVerified, effectiveAdminEmail, verifiedEmailAddress])

  // Reset verification status whenever the entered email changes to a different address
  useEffect(() => {
    if (mode !== 'create') return
    if (verifiedEmailAddress && effectiveAdminEmail !== verifiedEmailAddress) {
      setEmailVerified(false)
      setVerifiedEmailAddress('')
      setOtpSent(false)
      setOtpTargetEmail('')
      setOtpDigits(emptyOtpDigits)
      setOtpError('')
      setOtpSuccess('')
      setResendCooldown(0)
    } else if (otpSent && otpTargetEmail && effectiveAdminEmail !== otpTargetEmail) {
      setOtpSent(false)
      setOtpTargetEmail('')
      setOtpDigits(emptyOtpDigits)
      setOtpError('')
      setOtpSuccess('')
      setResendCooldown(0)
    }
  }, [effectiveAdminEmail, verifiedEmailAddress, otpSent, otpTargetEmail, mode])

  const planCards = useMemo(() => {
    const defaults = [
      { key: 'trial', name: 'Trial', price: 0, desc: 'Evaluation tier' },
      { key: 'basic', name: 'Basic', price: 999, desc: 'Standard POS & Billing' },
      { key: 'pro', name: 'Pro', price: 1999, desc: 'Multi-branch & Analytics' },
    ]
    return defaults.map((def) => {
      const matched = plans.find(
        (p) => p.name?.toLowerCase() === def.key || p.name?.toLowerCase().includes(def.key)
      )
      return {
        key: def.key,
        name: matched?.name || def.name,
        price: matched?.price ?? def.price,
        desc: def.desc,
      }
    })
  }, [plans])

  if (!open) return null

  const updateField = (field, value) => {
    setForm((prev) => {
      const next = { ...prev, [field]: value }
      if (mode === 'create' && syncAdminWithOwner) {
        if (field === 'ownerName') next.adminName = value
        if (field === 'email') next.adminEmail = value
        if (field === 'phone') next.adminPhone = value
      }
      return next
    })
  }

  const handleLogoFileChange = (event) => {
    const file = event.target.files?.[0]
    if (!file) return
    if (file.size > 1.5 * 1024 * 1024) {
      setError('Logo image size must be under 1.5 MB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        updateField('logo', reader.result)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleSendOtp = async () => {
    setOtpError('')
    setOtpSuccess('')
    setError('')

    const normalizedEmail = effectiveAdminEmail
    if (!normalizedEmail || !isValidEmailFormat(normalizedEmail)) {
      setOtpError('Please enter a valid email address before requesting an OTP.')
      return
    }

    // Normalize the form fields to lowercase
    if (syncAdminWithOwner) {
      setForm((prev) => ({
        ...prev,
        email: normalizedEmail,
        adminEmail: normalizedEmail,
      }))
    } else {
      setForm((prev) => ({
        ...prev,
        adminEmail: normalizedEmail,
      }))
    }

    setSendingOtp(true)
    try {
      const res = await sendCafeEmailVerification({
        email: normalizedEmail,
        cafeName: form.cafeName.trim(),
        adminName: (syncAdminWithOwner ? form.ownerName : form.adminName).trim(),
      })

      const cooldown = Number(res?.data?.resendCooldownSeconds ?? 60)
      setOtpSent(true)
      setOtpTargetEmail(normalizedEmail)
      setEmailVerified(false)
      setVerifiedEmailAddress('')
      setOtpDigits(emptyOtpDigits)
      setResendCooldown(cooldown)
      setOtpSuccess(`OTP sent to ${normalizedEmail}`)
      setTimeout(() => {
        otpInputRefs.current[0]?.focus()
      }, 60)
    } catch (err) {
      const retryAfter = Number(err?.response?.data?.retryAfterSeconds || 0)
      if (retryAfter > 0) {
        setResendCooldown(retryAfter)
      }
      setOtpError(
        getFriendlyErrorMessage(
          err,
          'Unable to send verification code. Please check the email address and try again.'
        )
      )
    } finally {
      setSendingOtp(false)
    }
  }

  const handleOtpDigitChange = (index, rawValue) => {
    const digit = String(rawValue || '').replace(/\D/g, '').slice(-1)
    setOtpError('')
    setOtpDigits((prev) => {
      const next = [...prev]
      next[index] = digit
      return next
    })
    if (digit && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, event) => {
    if (event.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowLeft' && index > 0) {
      otpInputRefs.current[index - 1]?.focus()
    } else if (event.key === 'ArrowRight' && index < 5) {
      otpInputRefs.current[index + 1]?.focus()
    } else if (event.key === 'Enter') {
      event.preventDefault()
      const joined = otpDigits.join('')
      if (joined.length === 6 && !verifyingOtp) {
        handleVerifyOtp()
      }
    }
  }

  const handleOtpPaste = (event) => {
    event.preventDefault()
    const pasted = (event.clipboardData?.getData('text') || '').replace(/\D/g, '').slice(0, 6)
    if (!pasted) return
    const next = [...emptyOtpDigits]
    for (let i = 0; i < pasted.length; i += 1) {
      next[i] = pasted[i]
    }
    setOtpDigits(next)
    setOtpError('')
    const focusIdx = Math.min(pasted.length, 5)
    otpInputRefs.current[focusIdx]?.focus()
  }

  const handleVerifyOtp = async () => {
    setOtpError('')
    setOtpSuccess('')
    setError('')

    const normalizedEmail = effectiveAdminEmail
    const code = otpDigits.join('')

    if (!normalizedEmail || !isValidEmailFormat(normalizedEmail)) {
      setOtpError('Please enter a valid email address.')
      return
    }

    if (!/^\d{6}$/.test(code)) {
      setOtpError('Please enter the complete 6-digit verification code.')
      return
    }

    setVerifyingOtp(true)
    try {
      await verifyCafeEmail({
        email: normalizedEmail,
        otp: code,
      })

      setEmailVerified(true)
      setVerifiedEmailAddress(normalizedEmail)
      setOtpSuccess('Email verified successfully')
      setOtpError('')
    } catch (err) {
      setEmailVerified(false)
      setVerifiedEmailAddress('')
      setOtpError(
        getFriendlyErrorMessage(
          err,
          'Verification failed. Please check the 6-digit code and try again.'
        )
      )
    } finally {
      setVerifyingOtp(false)
    }
  }

  const handleFormSubmit = async (event) => {
    event.preventDefault()
    setError('')

    const cafeName = form.cafeName.trim()
    const ownerName = form.ownerName.trim()
    const phone = form.phone.trim()
    const email = (form.email || effectiveAdminEmail).trim().toLowerCase()
    const adminName = (syncAdminWithOwner && mode === 'create' ? ownerName : form.adminName).trim()
    const adminEmail = effectiveAdminEmail
    const adminPhone = (syncAdminWithOwner && mode === 'create' ? phone : form.adminPhone).trim()

    if (!cafeName || !ownerName || !phone || !email) {
      setError('Please complete all required Café Information fields (Café Name, Owner Name, Phone, Email).')
      return
    }

    if (!isValidEmailFormat(email)) {
      setError('Please enter a valid Café Email address.')
      return
    }

    if (mode === 'create') {
      if (!adminName || !adminEmail || !form.temporaryPassword) {
        setError('Admin Name, Admin Email, and Temporary Password are required.')
        return
      }
      if (!isValidEmailFormat(adminEmail)) {
        setError('Please enter a valid Admin Email address.')
        return
      }
      if (!isCurrentEmailVerified) {
        setError('Please verify the email address using the 6-digit OTP before creating the café.')
        return
      }
      if (
        form.temporaryPassword.length < 8 ||
        !/[A-Za-z]/.test(form.temporaryPassword) ||
        !/\d/.test(form.temporaryPassword)
      ) {
        setError(
          'Temporary password must be at least 8 characters and include at least one letter and one number.'
        )
        return
      }
    }

    const payload = {
      cafeName,
      restaurantName: cafeName,
      name: cafeName,
      logo: form.logo.trim(),
      ownerName,
      phone,
      email: syncAdminWithOwner && mode === 'create' ? adminEmail : email,
      address: form.address.trim(),
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      plan: form.plan,
      subscriptionPlan: form.plan,
      adminName,
      adminEmail,
      ownerEmail: adminEmail,
      adminPhone,
      temporaryPassword: form.temporaryPassword,
      adminPassword: form.temporaryPassword,
      ownerPassword: form.temporaryPassword,
      emailVerified: isCurrentEmailVerified,
      settings: {
        currency: form.currency || 'INR',
        currencySymbol: form.currencySymbol || '₹',
        taxPercent: Number(form.taxPercent ?? 5),
        gstNumber: form.gstNumber.trim(),
        openingTime: form.openingTime || '09:00',
        closingTime: form.closingTime || '23:00',
        timezone: form.timezone || 'Asia/Kolkata',
        orderSettings: {
          allowDineIn: Boolean(form.allowDineIn),
          allowTakeaway: Boolean(form.allowTakeaway),
          allowQrOrdering: Boolean(form.allowQrOrdering),
        },
      },
    }

    try {
      await onSubmit(payload)
    } catch (submitErr) {
      setError(
        getFriendlyErrorMessage(
          submitErr,
          'Failed to save café account. Please check your inputs.'
        )
      )
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#241B15]/60 p-3 sm:p-5 backdrop-blur-xs"
      onClick={() => {
        if (!loading) onClose?.()
      }}
    >
      <div
        className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl border border-[#E8E1DA] bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sticky Modal Header */}
        <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-[#E8E1DA] bg-white/95 px-6 py-4 backdrop-blur-xs">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-xs">
              <Coffee size={21} />
            </div>
            <div>
              <h2 className="text-lg font-extrabold text-[#241B15]">
                {mode === 'edit' ? `Edit Café — ${initialCafe?.name || ''}` : 'Create New Café Account'}
              </h2>
              <p className="text-xs text-[#81766D]">
                {mode === 'edit'
                  ? 'Update café profile, address, subscription tier, and operating settings'
                  : 'Café Information → Admin Information → Email OTP Verification → Create Café'}
              </p>
            </div>
          </div>

          <button
            type="button"
            disabled={loading}
            onClick={onClose}
            className="rounded-xl p-2 text-[#81766D] transition-colors hover:bg-[#F7F5F2] hover:text-[#241B15]"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleFormSubmit} className="space-y-6 p-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-2xl border border-[#C75C5C]/30 bg-[#C75C5C]/10 p-4 text-xs font-semibold text-[#C75C5C]">
              <AlertCircle size={16} className="mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* =====================================================
              SECTION 1 — CAFÉ INFORMATION
             ===================================================== */}
          <div className="rounded-2xl border border-[#E8E1DA] bg-[#F7F5F2]/50 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E1DA]/80 pb-3">
              <div className="flex items-center gap-2">
                <Store size={17} className="text-[#6F4E37]" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#241B15]">
                  Section 1 — Café Information
                </h3>
              </div>
              <span className="badge-coffee text-[10px]">Tenant Profile</span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Café Name *
                </label>
                <input
                  type="text"
                  value={form.cafeName}
                  onChange={(e) => updateField('cafeName', e.target.value)}
                  placeholder="e.g. Aroma Roastery & Bistro"
                  required
                  className="input-field mt-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Owner Name *
                </label>
                <input
                  type="text"
                  value={form.ownerName}
                  onChange={(e) => updateField('ownerName', e.target.value)}
                  placeholder="e.g. Aarav Sharma"
                  required
                  className="input-field mt-1.5"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Phone *
                </label>
                <div className="relative mt-1.5">
                  <Phone
                    size={14}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                  />
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateField('phone', e.target.value)}
                    placeholder="+91 98765 43210"
                    required
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Business / Café Email *
                </label>
                <div className="relative mt-1.5">
                  <Mail
                    size={14}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                  />
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => updateField('email', e.target.value)}
                    placeholder="admin@example.com"
                    required
                    className="input-field pl-9"
                  />
                </div>
              </div>

              {/* Café Logo URL + Upload */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Café Logo (URL or Upload Image)
                </label>
                <div className="mt-1.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                  <div className="relative flex-1">
                    <ImageIcon
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                    />
                    <input
                      type="text"
                      value={form.logo}
                      onChange={(e) => updateField('logo', e.target.value)}
                      placeholder="https://example.com/logo.png or upload image"
                      className="input-field pl-9"
                    />
                  </div>
                  <label className="btn-secondary cursor-pointer text-xs px-3.5 py-2.5 shrink-0">
                    <Upload size={14} className="text-[#6F4E37]" />
                    <span>Upload Logo</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileChange}
                      className="hidden"
                    />
                  </label>
                  {form.logo && (
                    <div className="flex items-center gap-2">
                      <img
                        src={form.logo}
                        alt="Café Logo Preview"
                        className="h-10 w-10 rounded-xl border border-[#E8E1DA] object-cover bg-white"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => updateField('logo', '')}
                        className="text-xs font-semibold text-[#C75C5C] hover:underline"
                      >
                        Clear
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Address */}
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Street Address
                </label>
                <div className="relative mt-1.5">
                  <MapPin
                    size={14}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                  />
                  <input
                    type="text"
                    value={form.address}
                    onChange={(e) => updateField('address', e.target.value)}
                    placeholder="12 Park Street, Ground Floor"
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  City
                </label>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => updateField('city', e.target.value)}
                  placeholder="e.g. Jaipur"
                  className="input-field mt-1.5"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                    State
                  </label>
                  <input
                    type="text"
                    value={form.state}
                    onChange={(e) => updateField('state', e.target.value)}
                    placeholder="e.g. Rajasthan"
                    className="input-field mt-1.5"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                    Pincode
                  </label>
                  <input
                    type="text"
                    value={form.pincode}
                    onChange={(e) => updateField('pincode', e.target.value)}
                    placeholder="302001"
                    className="input-field mt-1.5"
                  />
                </div>
              </div>
            </div>

            {/* Subscription Plan Selector */}
            <div className="pt-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D] mb-2">
                Subscription Plan Tier
              </label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {planCards.map((tier) => {
                  const isSelected = form.plan === tier.key
                  return (
                    <button
                      key={tier.key}
                      type="button"
                      onClick={() => updateField('plan', tier.key)}
                      className={`flex flex-col justify-between rounded-2xl border p-3.5 text-left transition-all ${
                        isSelected
                          ? 'border-[#6F4E37] bg-[#6F4E37]/[0.08] ring-2 ring-[#6F4E37]/20'
                          : 'border-[#E8E1DA] bg-white hover:border-[#6F4E37]/40'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-extrabold uppercase tracking-wider text-[#241B15]">
                          {tier.name}
                        </span>
                        {isSelected && <CheckCircle2 size={15} className="text-[#6F4E37]" />}
                      </div>
                      <p className="mt-1 text-base font-extrabold text-[#6F4E37]">
                        ₹{Number(tier.price || 0).toLocaleString('en-IN')}
                        <span className="text-[11px] font-medium text-[#81766D]">/mo</span>
                      </p>
                      <p className="mt-0.5 text-[11px] text-[#81766D]">{tier.desc}</p>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          {/* =====================================================
              SECTION 2 — ADMIN ACCOUNT & EMAIL OTP VERIFICATION (Create Mode)
             ===================================================== */}
          {mode === 'create' && (
            <div className="rounded-2xl border border-[#E8E1DA] bg-[#F7F5F2]/50 p-5 space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between border-b border-[#E8E1DA]/80 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck size={17} className="text-[#6F4E37]" />
                  <div>
                    <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#241B15]">
                      Section 2 — Admin Information & Email Verification
                    </h3>
                    <p className="text-[11px] text-[#81766D]">
                      Verify the admin/business email with a 6-digit OTP before creating the café
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  {isCurrentEmailVerified && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-[#4F8A5A]/30 bg-[#4F8A5A]/15 px-3 py-1 text-xs font-extrabold text-[#4F8A5A]">
                      <Check size={13} className="stroke-[3]" />
                      <span>✓ Email Verified</span>
                    </span>
                  )}

                  <label className="inline-flex cursor-pointer items-center gap-2 text-xs font-semibold text-[#6F4E37]">
                    <input
                      type="checkbox"
                      checked={syncAdminWithOwner}
                      onChange={(e) => {
                        const checked = e.target.checked
                        setSyncAdminWithOwner(checked)
                        if (checked) {
                          setForm((prev) => ({
                            ...prev,
                            adminName: prev.ownerName,
                            adminEmail: prev.email,
                            adminPhone: prev.phone,
                          }))
                        }
                      }}
                      className="h-4 w-4 accent-[#6F4E37]"
                    />
                    <span>Same as Owner Info</span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                    Admin Name *
                  </label>
                  <div className="relative mt-1.5">
                    <User
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                    />
                    <input
                      type="text"
                      value={syncAdminWithOwner ? form.ownerName : form.adminName}
                      onChange={(e) => {
                        setSyncAdminWithOwner(false)
                        updateField('adminName', e.target.value)
                      }}
                      placeholder="Café Admin Full Name"
                      required
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                    Admin Phone
                  </label>
                  <div className="relative mt-1.5">
                    <Phone
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                    />
                    <input
                      type="tel"
                      value={syncAdminWithOwner ? form.phone : form.adminPhone}
                      onChange={(e) => {
                        setSyncAdminWithOwner(false)
                        updateField('adminPhone', e.target.value)
                      }}
                      placeholder="+91 98765 43210"
                      className="input-field pl-9"
                    />
                  </div>
                </div>

                {/* STEP 1: Email Address + Send Verification OTP */}
                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                      Email Address *
                    </label>
                    {isCurrentEmailVerified ? (
                      <span className="inline-flex items-center gap-1 text-xs font-extrabold text-[#4F8A5A]">
                        <CheckCircle2 size={14} />
                        <span>✓ Email Verified</span>
                      </span>
                    ) : (
                      <span className="text-[11px] font-semibold text-[#C98A5B]">
                        OTP Verification Required
                      </span>
                    )}
                  </div>

                  <div className="mt-1.5 flex flex-col gap-2.5 sm:flex-row sm:items-center">
                    <div className="relative flex-1">
                      <Mail
                        size={14}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                      />
                      <input
                        type="email"
                        value={syncAdminWithOwner ? form.email : form.adminEmail}
                        onChange={(e) => {
                          const val = e.target.value
                          if (syncAdminWithOwner) {
                            updateField('email', val)
                          } else {
                            updateField('adminEmail', val)
                          }
                        }}
                        placeholder="admin@example.com"
                        required
                        className={`input-field pl-9 ${
                          isCurrentEmailVerified
                            ? 'border-[#4F8A5A] bg-[#4F8A5A]/[0.05] pr-28'
                            : ''
                        }`}
                      />
                      {isCurrentEmailVerified && (
                        <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-full bg-[#4F8A5A] px-2.5 py-0.5 text-[10px] font-extrabold text-white">
                          <Check size={11} />
                          Verified
                        </span>
                      )}
                    </div>

                    {!isCurrentEmailVerified && (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={
                          sendingOtp ||
                          !effectiveAdminEmail ||
                          (otpSent && resendCooldown > 0)
                        }
                        className="btn-primary shrink-0 text-xs px-4 py-2.5"
                      >
                        {sendingOtp ? (
                          <>
                            <RefreshCw size={14} className="animate-spin" />
                            <span>Sending OTP...</span>
                          </>
                        ) : otpSent ? (
                          <>
                            <Send size={14} />
                            <span>
                              {resendCooldown > 0
                                ? `Resend in ${resendCooldown}s`
                                : 'Send Verification OTP'}
                            </span>
                          </>
                        ) : (
                          <>
                            <Send size={14} />
                            <span>Send Verification OTP</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* STEP 3 & STEP 4: OTP Input, Countdown Timer, and Verification Status Card */}
                {(otpSent || isCurrentEmailVerified || otpError) && (
                  <div className="sm:col-span-2">
                    <div
                      className={`rounded-2xl border p-4 transition-all ${
                        isCurrentEmailVerified
                          ? 'border-[#4F8A5A]/40 bg-[#4F8A5A]/[0.08]'
                          : 'border-[#E8E1DA] bg-white'
                      }`}
                    >
                      {/* Verified State */}
                      {isCurrentEmailVerified ? (
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#4F8A5A] text-white shadow-2xs">
                              <CheckCircle2 size={18} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-xs sm:text-sm font-extrabold text-[#241B15]">
                                  ✓ Email verified successfully
                                </p>
                                <span className="inline-flex items-center gap-1 rounded-full bg-[#4F8A5A]/15 px-2.5 py-0.5 text-[10px] font-extrabold text-[#4F8A5A]">
                                  ✓ Email Verified
                                </span>
                              </div>
                              <p className="text-xs text-[#81766D]">
                                Verified for <strong className="text-[#241B15]">{verifiedEmailAddress}</strong>. You can now create the café account.
                              </p>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Pending OTP Verification State */
                        <div className="space-y-3.5">
                          {otpSuccess && (
                            <div className="flex items-center justify-between gap-2 text-xs font-bold text-[#4F8A5A]">
                              <span className="inline-flex items-center gap-1.5">
                                <CheckCircle2 size={14} />
                                <span>{otpSuccess}</span>
                              </span>
                              <span className="text-[11px] font-medium text-[#81766D]">
                                Expires in 5 minutes
                              </span>
                            </div>
                          )}

                          {otpError && (
                            <div className="flex items-center gap-2 rounded-xl border border-[#C75C5C]/30 bg-[#C75C5C]/10 px-3 py-2 text-xs font-semibold text-[#C75C5C]">
                              <AlertCircle size={14} className="shrink-0" />
                              <span>{otpError}</span>
                            </div>
                          )}

                          {otpSent && (
                            <>
                              <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-[#241B15]">
                                  Enter Verification Code
                                </label>
                                <p className="mt-0.5 text-[11px] text-[#81766D]">
                                  Enter the 6-digit verification code sent to{' '}
                                  <span className="font-bold text-[#6F4E37]">{otpTargetEmail}</span>
                                </p>
                              </div>

                              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                                <div
                                  className="flex items-center gap-2"
                                  onPaste={handleOtpPaste}
                                >
                                  {otpDigits.map((digit, idx) => (
                                    <input
                                      key={idx}
                                      ref={(el) => {
                                        otpInputRefs.current[idx] = el
                                      }}
                                      type="text"
                                      inputMode="numeric"
                                      maxLength={1}
                                      value={digit}
                                      onChange={(e) => handleOtpDigitChange(idx, e.target.value)}
                                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                      aria-label={`OTP digit ${idx + 1}`}
                                      className="h-11 w-10 sm:w-11 rounded-xl border border-[#E8E1DA] bg-[#F7F5F2]/70 text-center text-base font-extrabold text-[#241B15] outline-none transition-all focus:border-[#6F4E37] focus:bg-white focus:ring-2 focus:ring-[#6F4E37]/20"
                                    />
                                  ))}
                                </div>

                                <button
                                  type="button"
                                  onClick={handleVerifyOtp}
                                  disabled={verifyingOtp || otpDigits.join('').length !== 6}
                                  className="btn-primary text-xs px-5 py-2.5 shrink-0"
                                >
                                  {verifyingOtp ? (
                                    <>
                                      <RefreshCw size={14} className="animate-spin" />
                                      <span>Verifying...</span>
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle2 size={14} />
                                      <span>Verify Email</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#F7F5F2] pt-2.5 text-xs text-[#81766D]">
                                <span>Didn&apos;t receive the code?</span>
                                {resendCooldown > 0 ? (
                                  <span className="font-bold text-[#6F4E37]">
                                    Resend OTP in {resendCooldown} second{resendCooldown === 1 ? '' : 's'}
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={handleSendOtp}
                                    disabled={sendingOtp}
                                    className="font-extrabold text-[#6F4E37] underline hover:text-[#2B2118]"
                                  >
                                    {sendingOtp ? 'Sending new OTP...' : 'Resend OTP'}
                                  </button>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                      Temporary Password *
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        updateField('temporaryPassword', generateTempPassword())
                        setShowPassword(true)
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6F4E37] hover:underline"
                    >
                      <Wand2 size={12} />
                      <span>Generate Password</span>
                    </button>
                  </div>
                  <div className="relative mt-1.5">
                    <Lock
                      size={14}
                      className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                    />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={form.temporaryPassword}
                      onChange={(e) => updateField('temporaryPassword', e.target.value)}
                      placeholder="Min 8 chars, 1 letter & 1 number"
                      required
                      className="input-field pl-9 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#81766D] hover:text-[#241B15]"
                      aria-label="Toggle password visibility"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =====================================================
              SECTION 3 — CAFÉ SETTINGS
             ===================================================== */}
          <div className="rounded-2xl border border-[#E8E1DA] bg-[#F7F5F2]/50 p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E8E1DA]/80 pb-3">
              <div className="flex items-center gap-2">
                <Settings size={17} className="text-[#6F4E37]" />
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#241B15]">
                  Section 3 — Café Settings
                </h3>
              </div>
              <span className="text-[11px] font-semibold text-[#81766D]">
                Defaults: INR (₹) · Asia/Kolkata
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Currency
                </label>
                <select
                  value={form.currency}
                  onChange={(e) => {
                    const val = e.target.value
                    updateField('currency', val)
                    updateField('currencySymbol', val === 'USD' ? '$' : val === 'EUR' ? '€' : '₹')
                  }}
                  className="input-field mt-1.5"
                >
                  <option value="INR">INR (₹)</option>
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Default Tax / GST (%)
                </label>
                <select
                  value={form.taxPercent}
                  onChange={(e) => updateField('taxPercent', Number(e.target.value))}
                  className="input-field mt-1.5"
                >
                  <option value={0}>0% (Exempt)</option>
                  <option value={5}>5% GST (2.5% CGST + 2.5% SGST)</option>
                  <option value={12}>12% GST</option>
                  <option value={18}>18% GST (9% CGST + 9% SGST)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  GSTIN Number (Optional)
                </label>
                <input
                  type="text"
                  value={form.gstNumber}
                  onChange={(e) => updateField('gstNumber', e.target.value.toUpperCase())}
                  placeholder="e.g. 08ABCDE1234F1Z5"
                  className="input-field mt-1.5 uppercase"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Opening Time
                </label>
                <div className="relative mt-1.5">
                  <Clock
                    size={14}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                  />
                  <input
                    type="time"
                    value={form.openingTime}
                    onChange={(e) => updateField('openingTime', e.target.value)}
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Closing Time
                </label>
                <div className="relative mt-1.5">
                  <Clock
                    size={14}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                  />
                  <input
                    type="time"
                    value={form.closingTime}
                    onChange={(e) => updateField('closingTime', e.target.value)}
                    className="input-field pl-9"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                  Timezone
                </label>
                <div className="relative mt-1.5">
                  <Globe
                    size={14}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[#81766D]"
                  />
                  <input
                    type="text"
                    value={form.timezone}
                    onChange={(e) => updateField('timezone', e.target.value)}
                    placeholder="Asia/Kolkata"
                    className="input-field pl-9"
                  />
                </div>
              </div>
            </div>

            {/* Order Settings */}
            <div className="pt-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D] mb-2">
                Order Channels Enabled
              </label>
              <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-3">
                {[
                  { key: 'allowDineIn', label: 'Dine-In POS Orders' },
                  { key: 'allowTakeaway', label: 'Takeaway / Counter' },
                  { key: 'allowQrOrdering', label: 'Customer QR Table Ordering' },
                ].map((opt) => (
                  <label
                    key={opt.key}
                    className="flex cursor-pointer items-center justify-between rounded-xl border border-[#E8E1DA] bg-white px-3.5 py-2.5 text-xs font-bold text-[#241B15]"
                  >
                    <span>{opt.label}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(form[opt.key])}
                      onChange={(e) => updateField(opt.key, e.target.checked)}
                      className="h-4 w-4 accent-[#6F4E37]"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Footer */}
          <div className="flex flex-col gap-3 border-t border-[#E8E1DA] pt-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="text-xs text-[#81766D]">
              {mode === 'create' && !isCurrentEmailVerified ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-[#C98A5B]">
                  <AlertCircle size={14} />
                  <span>Verify the admin email with OTP to enable Create Café</span>
                </span>
              ) : mode === 'create' ? (
                <span className="inline-flex items-center gap-1.5 font-bold text-[#4F8A5A]">
                  <CheckCircle2 size={14} />
                  <span>✓ Email Verified — Ready to create café &amp; admin account</span>
                </span>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="btn-secondary text-xs px-5 py-2.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (mode === 'create' && !isCurrentEmailVerified)}
                className="btn-primary text-xs px-6 py-2.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? mode === 'edit'
                    ? 'Saving Café Changes...'
                    : 'Creating Café...'
                  : mode === 'edit'
                    ? 'Save Café Changes'
                    : 'Create Café'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}

export function EditCafeAdminModal({ open, onClose, admin, cafeName, onSubmit, loading = false }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open || !admin) return
    setName(admin.name || '')
    setEmail(admin.email || '')
    setPhone(admin.phone || '')
    setError('')
  }, [open, admin])

  if (!open || !admin) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (!name.trim() || !email.trim()) {
      setError('Admin Name and Email are required.')
      return
    }
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
      })
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to update admin details.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#241B15]/55 p-4 backdrop-blur-xs"
      onClick={() => !loading && onClose?.()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#E8E1DA] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between border-b border-[#F7F5F2] pb-3">
          <div>
            <h3 className="text-base font-extrabold text-[#241B15]">Edit Café Admin Account</h3>
            <p className="text-xs text-[#81766D]">{cafeName || admin.email}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#81766D] hover:bg-[#F7F5F2]"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#C75C5C]/30 bg-[#C75C5C]/10 p-3 text-xs font-semibold text-[#C75C5C]">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
              Admin Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field mt-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
              Admin Email *
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field mt-1.5"
            />
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
              Admin Phone
            </label>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="input-field mt-1.5"
            />
          </div>

          <div className="flex justify-end gap-2.5 border-t border-[#F7F5F2] pt-4">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs px-5 py-2">
              {loading ? 'Saving...' : 'Save Admin'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export function ResetCafeAdminPasswordModal({
  open,
  onClose,
  admin,
  cafeName,
  onSubmit,
  loading = false,
}) {
  const [newPassword, setNewPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!open) return
    setNewPassword('')
    setError('')
    setShowPassword(false)
  }, [open])

  if (!open) return null

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (
      newPassword.length < 8 ||
      !/[A-Za-z]/.test(newPassword) ||
      !/\d/.test(newPassword)
    ) {
      setError(
        'Password must be at least 8 characters and include at least one letter and one number.'
      )
      return
    }
    try {
      await onSubmit(newPassword)
    } catch (err) {
      setError(err?.response?.data?.message || err?.message || 'Unable to reset password.')
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#241B15]/55 p-4 backdrop-blur-xs"
      onClick={() => !loading && onClose?.()}
    >
      <div
        className="w-full max-w-md rounded-2xl border border-[#E8E1DA] bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between border-b border-[#F7F5F2] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#6F4E37]/10 text-[#6F4E37]">
              <KeyRound size={18} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-[#241B15]">Reset Admin Password</h3>
              <p className="text-xs text-[#81766D]">
                {cafeName ? `${cafeName} (${admin?.email || 'Admin'})` : admin?.email}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#81766D] hover:bg-[#F7F5F2]"
          >
            <X size={16} />
          </button>
        </div>

        {error && (
          <div className="mb-4 flex items-center gap-2 rounded-xl border border-[#C75C5C]/30 bg-[#C75C5C]/10 p-3 text-xs font-semibold text-[#C75C5C]">
            <AlertCircle size={15} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-[#81766D]">
                New Temporary Password *
              </label>
              <button
                type="button"
                onClick={() => {
                  setNewPassword(generateTempPassword())
                  setShowPassword(true)
                }}
                className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6F4E37] hover:underline"
              >
                <Wand2 size={12} />
                <span>Generate Strong</span>
              </button>
            </div>
            <div className="relative mt-1.5">
              <input
                type={showPassword ? 'text' : 'password'}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, 1 letter & 1 number"
                required
                className="input-field pr-9"
              />
              <button
                type="button"
                onClick={() => setShowPassword((p) => !p)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#81766D] hover:text-[#241B15]"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
            <p className="mt-1.5 text-[11px] text-[#81766D]">
              This password will be securely hashed with bcrypt before saving. Existing passwords are never displayed.
            </p>
          </div>

          <div className="flex justify-end gap-2.5 border-t border-[#F7F5F2] pt-4">
            <button type="button" onClick={onClose} className="btn-secondary text-xs px-4 py-2">
              Cancel
            </button>
            <button type="submit" disabled={loading} className="btn-primary text-xs px-5 py-2">
              {loading ? 'Resetting...' : 'Reset Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CreateCafeModal
