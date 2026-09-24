import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowRight, Coffee, QrCode, Sparkles } from 'lucide-react'
import { useCustomer } from '../context/CustomerContext.jsx'

function Welcome() {
  const navigate = useNavigate()
  const { isVerified, table } = useCustomer()
  const [tokenInput, setTokenInput] = useState('')

  const handleManualEnter = (e) => {
    e.preventDefault()
    if (tokenInput.trim()) {
      navigate(`/t/${tokenInput.trim()}`)
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[#F7F5F2] px-4 py-12">
      <div className="w-full max-w-sm rounded-3xl border border-[#EBE7DF] bg-white p-8 text-center shadow-xl">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#6F4E37] text-white shadow-md">
          <Coffee size={32} />
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-[#6F4E37]/10 px-3 py-1 text-xs font-bold uppercase tracking-wider text-[#6F4E37] mb-2">
          <Sparkles size={12} />
          Digital Dining Portal
        </span>

        <h1 className="text-2xl font-black tracking-tight text-[#2B2118]">
          Café Table Self-Ordering
        </h1>

        <p className="mt-2 text-xs text-[#7A7068]">
          Scan the QR code on your dining table to explore our menu, customize your order, and send items straight to the kitchen.
        </p>

        {isVerified && table && (
          <div className="mt-5 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-left">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">
              Active Dining Session
            </span>
            <p className="font-bold text-sm text-[#2B2118] mt-0.5">
              Table {table.tableNumber}
            </p>
            <button
              type="button"
              onClick={() => navigate('/t/current/menu')}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-[#6F4E37] py-2 text-xs font-bold text-white shadow-xs"
            >
              <span>Return to Table Menu</span>
              <ArrowRight size={14} />
            </button>
          </div>
        )}

        <div className="mt-6 border-t border-[#F7F5F2] pt-5">
          <div className="flex items-center justify-center gap-2 text-xs font-semibold text-[#7A7068] mb-3">
            <QrCode size={16} className="text-[#6F4E37]" />
            <span>Have a table QR token?</span>
          </div>

          <form onSubmit={handleManualEnter} className="flex gap-2">
            <input
              type="text"
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="e.g. table-1 token"
              className="flex-1 rounded-xl border border-[#EBE7DF] bg-[#F7F5F2] px-3.5 py-2 text-xs text-[#2B2118] focus:bg-white focus:border-[#6F4E37] focus:outline-none"
            />
            <button
              type="submit"
              className="rounded-xl bg-[#6F4E37] px-4 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#2B2118]"
            >
              Open
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}

export default Welcome
