import { useEffect, useState } from 'react'
import { AlertCircle, Calendar, Phone, Receipt, Search, UserRound, Users, X } from 'lucide-react'
import { getCustomerById, getCustomers, lookupCustomerByPhone } from '../api/customerCrmApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })

function money(value) {
  return currency.format(Number(value) || 0)
}

function formatDate(value) {
  if (!value) return 'Never'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return 'Unknown'
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }).format(date)
}

function Customers() {
  const { user } = useAuth()
  const isAllowed = user?.role === 'owner' || user?.role === 'manager'

  const [customers, setCustomers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadingDetails, setLoadingDetails] = useState(false)
  const [error, setError] = useState('')

  const loadCustomers = async (term = '') => {
    try {
      setLoading(true)
      setError('')
      const query = term.trim()
      let response
      if (query) {
        response = await lookupCustomerByPhone(query)
        const customer = response.data?.data
        setCustomers(customer ? [customer] : [])
      } else {
        response = await getCustomers({ search: '', limit: 50 })
        setCustomers(response.data?.data || [])
      }
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load customer data.')
      setCustomers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAllowed) return
    loadCustomers(searchTerm)
  }, [isAllowed])

  const openCustomer = async (customerId) => {
    try {
      setLoadingDetails(true)
      setError('')
      const response = await getCustomerById(customerId)
      setSelectedCustomer(response.data?.data || null)
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load customer details.')
    } finally {
      setLoadingDetails(false)
    }
  }

  const handleSearch = async (event) => {
    event.preventDefault()
    await loadCustomers(searchTerm)
  }

  if (!isAllowed) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center p-6">
        <div className="rounded-2xl border border-[#EBE7DF] bg-white p-8 text-center shadow-xs max-w-md">
          <h2 className="text-xl font-bold text-[#2B2118]">Access Restricted</h2>
          <p className="mt-2 text-sm text-[#7A7068]">
            Only café owners and managers are authorized to view CRM guest profiles and loyalty rewards.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[#2B2118]">Customer CRM &amp; Loyalty</h1>
          <p className="mt-1 text-sm text-[#7A7068]">
            Guest profiles, contact records, visit frequency, and loyalty points history
          </p>
        </div>

        <form onSubmit={handleSearch} className="flex items-center gap-2">
          <div className="relative min-w-[240px]">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by phone or name..."
              className="w-full rounded-xl border border-[#EBE7DF] bg-white py-2 pl-9 pr-3 text-xs text-[#2B2118] focus:border-[#6F4E37] focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="rounded-xl bg-[#6F4E37] px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#2B2118]"
          >
            Search
          </button>
        </form>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-[#C75C5C]">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Grid Layout: Customer List + Details Panel */}
      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.9fr]">
        {/* Customer Cards Column */}
        <div className="space-y-3">
          {loading ? (
            <div className="rounded-2xl border border-[#EBE7DF] bg-white p-8 text-center text-sm text-[#7A7068]">
              Loading customer profiles...
            </div>
          ) : customers.length > 0 ? (
            customers.map((customer) => {
              const isSelected = (selectedCustomer?._id || selectedCustomer?.id) === (customer._id || customer.id)

              return (
                <div
                  key={customer._id || customer.id}
                  className={`flex flex-col justify-between rounded-2xl border bg-white p-5 shadow-xs transition-all ${
                    isSelected
                      ? 'border-[#6F4E37] ring-2 ring-[#6F4E37]/20'
                      : 'border-[#EBE7DF] hover:border-[#6F4E37]/30'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F7F5F2] text-[#6F4E37] border border-[#EBE7DF]">
                        <UserRound size={20} />
                      </div>
                      <div>
                        <h3 className="font-bold text-[#2B2118]">
                          {customer.name || 'Café Guest'}
                        </h3>
                        <p className="mt-0.5 text-xs text-[#7A7068]">
                          {customer.phone || 'No phone recorded'}
                        </p>
                      </div>
                    </div>

                    <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-700 border border-emerald-200">
                      {Number(customer.loyaltyPoints || 0)} pts
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2 border-t border-[#F7F5F2] pt-3 text-xs text-[#7A7068]">
                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Orders
                      </span>
                      <span className="mt-0.5 font-bold text-[#2B2118]">
                        {Number(customer.totalOrders || 0)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Total Spent
                      </span>
                      <span className="mt-0.5 font-bold text-[#6F4E37]">
                        {money(customer.totalSpend)}
                      </span>
                    </div>

                    <div>
                      <span className="block text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                        Last Visit
                      </span>
                      <span className="mt-0.5 font-medium text-[#2B2118]">
                        {formatDate(customer.lastVisitAt)}
                      </span>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      type="button"
                      onClick={() => openCustomer(customer._id || customer.id)}
                      className="rounded-lg bg-[#F7F5F2] px-3 py-1 text-xs font-semibold text-[#6F4E37] hover:bg-[#6F4E37] hover:text-white transition-all shadow-2xs"
                    >
                      View Full Details
                    </button>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="flex min-h-[30vh] flex-col items-center justify-center rounded-2xl border border-dashed border-[#EBE7DF] bg-white p-8 text-center">
              <Users className="text-gray-300 mb-3" size={40} />
              <h3 className="font-bold text-[#2B2118]">No guests found</h3>
              <p className="mt-1 text-sm text-[#7A7068]">
                {searchTerm ? `No results for "${searchTerm}"` : 'Customer records will populate when phone numbers are entered during billing'}
              </p>
            </div>
          )}
        </div>

        {/* Selected Customer Details Panel */}
        <aside className="rounded-2xl border border-[#EBE7DF] bg-white p-6 shadow-xs">
          {loadingDetails ? (
            <div className="py-12 text-center text-sm text-[#7A7068]">
              Loading guest profile details...
            </div>
          ) : selectedCustomer ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between border-b border-[#F7F5F2] pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#6F4E37] text-white">
                    <UserRound size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#2B2118]">
                      {selectedCustomer.name || 'Café Guest'}
                    </h2>
                    <p className="text-xs text-[#7A7068]">{selectedCustomer.phone || 'No phone'}</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedCustomer(null)}
                  className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Stats Box */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-[#EBE7DF] bg-[#F7F5F2]/60 p-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A7068]">
                    Available Loyalty
                  </span>
                  <p className="mt-1 text-xl font-black text-[#4F8A5A]">
                    {Number(selectedCustomer.loyaltyPoints || 0)} pts
                  </p>
                </div>
                <div className="rounded-xl border border-[#EBE7DF] bg-[#F7F5F2]/60 p-3.5">
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-[#7A7068]">
                    Lifetime Value
                  </span>
                  <p className="mt-1 text-xl font-black text-[#6F4E37]">
                    {money(selectedCustomer.totalSpend)}
                  </p>
                </div>
              </div>

              {/* Recent Bills List */}
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#7A7068] mb-3">
                  Recent Invoices
                </h3>
                {selectedCustomer.recentBills?.length > 0 ? (
                  <div className="divide-y divide-[#F7F5F2] rounded-xl border border-[#EBE7DF] bg-white overflow-hidden">
                    {selectedCustomer.recentBills.map((bill) => (
                      <div key={bill._id || bill.id} className="p-3 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#2B2118]">Bill #{bill.billNumber}</span>
                          <span className="text-gray-400">{formatDate(bill.createdAt)}</span>
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[#7A7068]">
                          <span>Paid via {bill.paymentMode || 'N/A'}</span>
                          <span className="font-bold text-[#6F4E37]">{money(bill.total)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-[#7A7068] rounded-xl border border-dashed border-[#EBE7DF] p-4 text-center">
                    No past bills associated with this guest.
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="flex min-h-[30vh] flex-col items-center justify-center text-center text-[#7A7068]">
              <UserRound className="text-gray-300 mb-3" size={36} />
              <h4 className="font-bold text-[#2B2118]">Select a guest</h4>
              <p className="mt-1 text-xs text-[#7A7068] max-w-[200px]">
                Click on any customer card to review profile, loyalty points, and purchase history
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}

export default Customers
