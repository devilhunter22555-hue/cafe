import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Shield, LogOut, CreditCard } from 'lucide-react'
import { useAdminAuth } from '../context/AdminAuthContext.jsx'
import { getRestaurants } from '../api/adminApi.js'

const planStyles = {
  trial: 'bg-slate-100 text-slate-700',
  basic: 'bg-indigo-100 text-indigo-700',
  pro: 'bg-amber-100 text-amber-800'
}

function Dashboard() {
  const { admin, logout } = useAdminAuth()
  const [restaurants, setRestaurants] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchRestaurants = async () => {
      try {
        const response = await getRestaurants()
        setRestaurants(response.data || [])
      } catch (fetchError) {
        setError(fetchError.response?.data?.message || 'Unable to load restaurants.')
      } finally {
        setLoading(false)
      }
    }

    fetchRestaurants()
  }, [])

  const handleLogout = () => {
    logout()
    window.location.assign('/login')
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <nav className="bg-white shadow-sm px-6 py-4">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-primary">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">Platform</p>
              <p className="text-xl font-bold text-secondary">Admin Console</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-secondary">{admin?.name || 'Super Admin'}</span>
            <Link to="/dashboard/plans" className="btn-secondary flex items-center gap-2">
              <CreditCard className="h-4 w-4" />
              Plans
            </Link>
            <button type="button" onClick={handleLogout} className="btn-secondary flex items-center gap-2">
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-6xl px-6 py-8">
        <h1 className="mb-6 text-2xl font-bold text-secondary">Restaurants</h1>

        {loading && <p className="text-sm text-slate-500">Loading restaurants...</p>}
        {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-danger">{error}</p>}

        {!loading && !error && (
          <div className="space-y-4">
            {restaurants.map((restaurant) => (
              <div key={restaurant._id} className="card flex items-center justify-between gap-4 p-4">
                <div className="min-w-0 flex-1">
                  <h2 className="text-lg font-semibold text-secondary">{restaurant.name}</h2>
                  <p className="text-sm text-gray-500">
                    {restaurant.owner?.name || 'Owner'} • {restaurant.owner?.email || 'No owner email'}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {restaurant.branchCount || 0} branches • {restaurant.staffCount || 0} staff
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2 py-1 text-xs font-medium ${planStyles[restaurant.plan] || 'bg-slate-100 text-slate-600'}`}>
                    {restaurant.plan || 'trial'}
                  </span>

                  <span className={restaurant.isActive ? 'badge-success' : 'badge-danger'}>
                    {restaurant.isActive ? 'Active' : 'Suspended'}
                  </span>

                  <Link to={`/dashboard/restaurants/${restaurant._id}`} className="btn-secondary compact">
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

export default Dashboard
