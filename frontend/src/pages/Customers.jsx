import { useEffect, useState } from 'react'
import { Search, UserRound, Users, X } from 'lucide-react'
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
        response = await getCustomers({ limit: 50 })
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
      <main className="p-6">
        <div className="card mx-auto max-w-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-secondary">Access denied</h1>
          <p className="mt-3 text-gray-500">Only owners and managers can view customer CRM records.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <Users className="text-primary" />
          <h1 className="text-2xl font-bold text-secondary">Customer CRM</h1>
        </div>

        <form className="flex items-center gap-2" onSubmit={handleSearch}>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
            <input
              className="input-field w-full min-w-[240px] pl-9"
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Search by phone or name"
              type="search"
              value={searchTerm}
            />
          </div>
          <button className="btn-primary" type="submit">Search</button>
        </form>
      </header>

      {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-[1.3fr_0.7fr]">
        <section className="space-y-3">
          {loading ? (
            <div className="card p-6 text-gray-500">Loading customers...</div>
          ) : customers.length === 0 ? (
            <div className="card p-6 text-gray-500">No customers found.</div>
          ) : (
            customers.map((customer) => (
              <article className="card p-4" key={customer._id || customer.id}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="font-semibold text-secondary">{customer.name || 'Unnamed customer'}</div>
                    <div className="mt-1 text-sm text-gray-500">{customer.phone || 'No phone recorded'}</div>
                  </div>

                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {Number(customer.loyaltyPoints || 0)} pts
                  </span>
                </div>

                <div className="mt-3 grid gap-2 text-sm text-gray-600 sm:grid-cols-3">
                  <div><span className="block text-xs uppercase tracking-wide text-gray-400">Orders</span><span className="font-medium text-secondary">{Number(customer.totalOrders || 0)}</span></div>
                  <div><span className="block text-xs uppercase tracking-wide text-gray-400">Spend</span><span className="font-medium text-secondary">{money(customer.totalSpend)}</span></div>
                  <div><span className="block text-xs uppercase tracking-wide text-gray-400">Last visit</span><span className="font-medium text-secondary">{formatDate(customer.lastVisitAt)}</span></div>
                </div>

                <div className="mt-4 flex justify-end">
                  <button className="btn-secondary px-3 py-2 text-sm" onClick={() => openCustomer(customer._id || customer.id)} type="button">
                    View details
                  </button>
                </div>
              </article>
            ))
          )}
        </section>

        <aside className="card p-5">
          {loadingDetails ? (
            <div className="text-sm text-gray-500">Loading customer details...</div>
          ) : selectedCustomer ? (
            <>
              <div className="mb-4 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound size={20} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-secondary">{selectedCustomer.name || 'Unnamed customer'}</h2>
                  <p className="text-sm text-gray-500">{selectedCustomer.phone || 'No phone'}</p>
                </div>
              </div>

              <div className="grid gap-3 text-sm text-gray-600 sm:grid-cols-2">
                <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs uppercase tracking-wide text-gray-400">Loyalty points</div><div className="mt-1 text-lg font-bold text-primary">{Number(selectedCustomer.loyaltyPoints || 0)}</div></div>
                <div className="rounded-lg bg-slate-50 p-3"><div className="text-xs uppercase tracking-wide text-gray-400">Total spend</div><div className="mt-1 text-lg font-bold text-secondary">{money(selectedCustomer.totalSpend)}</div></div>
              </div>

              <div className="mt-5">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">Recent bills</h3>
                {selectedCustomer.recentBills?.length ? (
                  <div className="space-y-3">
                    {selectedCustomer.recentBills.map((bill) => (
                      <div className="rounded-lg border border-slate-200 p-3" key={bill._id || bill.id}>
                        <div className="flex items-center justify-between gap-3">
                          <span className="font-medium text-secondary">{bill.billNumber || 'Bill'}</span>
                          <span className="text-xs text-gray-500">{formatDate(bill.createdAt)}</span>
                        </div>
                        <div className="mt-2 text-sm text-gray-600">
                          <div>Mode: {bill.paymentMode || 'N/A'}</div>
                          <div>Total: <span className="font-semibold text-secondary">{money(bill.total)}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No recent bills found.</p>
                )}
              </div>
            </>
          ) : (
            <div className="space-y-3 text-sm text-gray-500">
              <div className="flex items-center justify-between">
                <span className="font-medium text-secondary">Customer details</span>
                <button className="rounded-full p-1 hover:bg-slate-100" type="button">
                  <X size={16} />
                </button>
              </div>
              <p>Select a customer to view profile details, loyalty points, and recent bills.</p>
            </div>
          )}
        </aside>
      </div>
    </main>
  )
}

export default Customers
