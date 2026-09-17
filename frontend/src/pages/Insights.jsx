import { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, CheckCircle2, TrendingDown, TrendingUp } from 'lucide-react'
import { getFoodCostSummary, getLowStockForecast, getPriceTrends } from '../api/insightsApi.js'
import { useAuth } from '../context/AuthContext.jsx'

const currency = new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 2 })

function money(value) {
  return currency.format(Number(value) || 0)
}

function formatDate(date) {
  return date.toISOString().slice(0, 10)
}

function rangeFor(days) {
  const end = new Date()
  const start = new Date(end)
  start.setDate(start.getDate() - days + 1)
  return { from: formatDate(start), to: formatDate(end) }
}

function Insights() {
  const { user } = useAuth()
  const isAllowed = user?.role === 'owner' || user?.role === 'manager'

  const [range, setRange] = useState(() => rangeFor(30))
  const [activeRange, setActiveRange] = useState('30')
  const [foodCostSummary, setFoodCostSummary] = useState(null)
  const [priceTrends, setPriceTrends] = useState([])
  const [lowStockItems, setLowStockItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!isAllowed) return

    let active = true

    const loadData = async () => {
      setLoading(true)
      try {
        const [foodResponse, priceResponse, lowStockResponse] = await Promise.all([
          getFoodCostSummary(range.from, range.to),
          getPriceTrends(30),
          getLowStockForecast()
        ])

        if (!active) return

        setFoodCostSummary(foodResponse.data?.data || null)
        setPriceTrends(priceResponse.data?.data || [])
        setLowStockItems(lowStockResponse.data?.data || [])
        setError('')
      } catch (requestError) {
        if (active) {
          setError(requestError.response?.data?.message || 'Unable to load insights')
        }
      } finally {
        if (active) setLoading(false)
      }
    }

    loadData()
    return () => { active = false }
  }, [isAllowed, range.from, range.to])

  const meaningfulPriceChanges = useMemo(
    () => (priceTrends || []).filter((item) => Math.abs(Number(item.percentChange) || 0) > 2),
    [priceTrends]
  )

  const applyQuickRange = (days) => {
    const nextRange = rangeFor(days)
    setRange(nextRange)
    setActiveRange(String(days))
  }

  const foodCostColor = useMemo(() => {
    const value = Number(foodCostSummary?.foodCostPercentage) || 0
    if (value < 30) return 'text-success'
    if (value <= 35) return 'text-warning'
    return 'text-danger'
  }, [foodCostSummary])

  const foodCostComparison = Number(foodCostSummary?.comparisonToPreviousPeriod) || 0
  const comparisonTone = foodCostComparison <= 0 ? 'text-success' : 'text-danger'
  const comparisonIcon = foodCostComparison <= 0 ? TrendingDown : TrendingUp
  const comparisonLabel = `${Math.abs(foodCostComparison).toFixed(1)}%`

  if (!isAllowed) {
    return (
      <main className="mx-auto max-w-6xl p-6">
        <div className="card mx-auto max-w-lg p-6 text-center">
          <h1 className="text-2xl font-bold text-secondary">Access denied</h1>
          <p className="mt-3 text-gray-500">Only owners and managers can access insights.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl p-6">
      <h1 className="mb-2 text-2xl font-bold text-secondary">Insights</h1>
      <p className="mb-6 text-gray-500">Understand what's driving your numbers</p>

      <section className="card mb-6 p-6">
        <div className="mb-4 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <h2 className="text-xl font-semibold text-secondary">Food Cost</h2>
          <div className="flex flex-wrap items-end gap-3">
            <label className="text-sm text-gray-600">
              From
              <input
                className="input-field mt-1"
                onChange={(event) => {
                  setRange((current) => ({ ...current, from: event.target.value }))
                  setActiveRange('')
                }}
                type="date"
                value={range.from}
              />
            </label>
            <label className="text-sm text-gray-600">
              To
              <input
                className="input-field mt-1"
                onChange={(event) => {
                  setRange((current) => ({ ...current, to: event.target.value }))
                  setActiveRange('')
                }}
                type="date"
                value={range.to}
              />
            </label>
            <div className="flex gap-2">
              {[7, 30, 90].map((days) => (
                <button
                  className={`btn-secondary px-3 py-2 text-sm ${activeRange === String(days) ? 'border-primary bg-primary/10 text-primary' : ''}`}
                  key={days}
                  onClick={() => applyQuickRange(days)}
                  type="button"
                >
                  {days === 7 ? '7 Days' : days === 30 ? '30 Days' : '90 Days'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">{error}</div>}

        {loading ? (
          <p className="text-gray-500">Loading cost data...</p>
        ) : (
          <>
            <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
              <div>
                <div className={`text-4xl font-bold ${foodCostColor}`}>
                  {Number(foodCostSummary?.foodCostPercentage || 0).toFixed(1)}%
                </div>
              </div>

              <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${comparisonTone === 'text-success' ? 'bg-green-50 text-success' : 'bg-red-50 text-danger'}`}>
                {comparisonIcon === TrendingDown ? <TrendingDown size={15} /> : <TrendingUp size={15} />}
                {comparisonLabel}
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Revenue</div>
                <div className="mt-2 text-2xl font-bold text-secondary">{money(foodCostSummary?.totalRevenue || 0)}</div>
              </div>
              <div className="rounded-xl bg-slate-50 p-4">
                <div className="text-xs uppercase tracking-wide text-gray-500">Estimated Food Cost</div>
                <div className="mt-2 text-2xl font-bold text-secondary">{money(foodCostSummary?.estimatedFoodCost || 0)}</div>
              </div>
            </div>

            {(foodCostSummary?.itemsWithUnknownCost || []).length > 0 && (
              <div className="mt-4 rounded border border-amber-200 bg-amber-50 p-3 text-gray-700">
                <p className="text-xs text-gray-500">
                  Some items don't have purchase price history yet, so this estimate may be incomplete
                </p>
                <ul className="mt-2 list-disc pl-5 text-xs text-gray-500">
                  {(foodCostSummary.itemsWithUnknownCost || []).map((item) => (
                    <li key={item.inventoryItemId || item.name}>{item.name}</li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </section>

      <section className="card mb-6 p-6">
        <h2 className="mb-4 text-xl font-semibold text-secondary">Price Changes</h2>

        {meaningfulPriceChanges.length === 0 ? (
          <p className="text-gray-400">No significant price changes recently</p>
        ) : (
          <div className="space-y-3">
            {meaningfulPriceChanges.map((item) => {
              const percentValue = Number(item.percentChange) || 0
              const isIncrease = percentValue > 0
              const changeTone = isIncrease ? 'text-danger' : 'text-success'
              const Arrow = isIncrease ? TrendingUp : TrendingDown

              return (
                <div className="flex flex-col gap-2 rounded-xl border border-slate-200 p-3 md:flex-row md:items-center md:justify-between" key={item.inventoryItemId}>
                  <div>
                    <div className="font-medium text-secondary">{item.name} <span className="text-xs text-gray-500">({item.unit})</span></div>
                    <div className="text-sm text-gray-500">{money(item.previousPrice)} → {money(item.currentPrice)}</div>
                  </div>

                  <div className={`inline-flex items-center gap-1 text-sm font-semibold ${changeTone}`}>
                    <Arrow size={14} />
                    {Math.abs(percentValue).toFixed(1)}%
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>

      <section className="card p-6">
        <div className="mb-4 flex items-center gap-2">
          <AlertTriangle className="text-warning" size={20} />
          <h2 className="text-xl font-semibold text-secondary">Running Low Soon</h2>
        </div>

        {lowStockItems.length === 0 ? (
          <div className="flex items-center gap-2 text-gray-400">
            <CheckCircle2 size={18} />
            <span>Nothing running low right now</span>
          </div>
        ) : (
          <div className="space-y-3">
            {lowStockItems.map((item) => {
              const daysRemaining = Number(item.estimatedDaysRemaining) || 0
              const urgencyTone = daysRemaining < 1 ? 'text-danger' : 'text-warning'

              return (
                <div className="flex items-center justify-between rounded-xl border border-slate-200 p-3" key={item.name}>
                  <div>
                    <div className="font-medium text-secondary">{item.name}</div>
                    <div className="text-sm text-gray-500">{item.currentStock} {item.unit}</div>
                  </div>

                  <div className={`text-lg font-bold ${urgencyTone}`}>
                    {daysRemaining.toFixed(1)} days
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </main>
  )
}

export default Insights
