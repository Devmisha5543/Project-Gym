import { useCallback, useEffect, useState, useId } from 'react'
import {
  Activity,
  AlertCircle,
  ArrowDownRight,
  ArrowUpRight,
  Building2,
  Calendar,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Info,
  Layers,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users
} from 'lucide-react'
import { motion, AnimatePresence, useReducedMotion } from 'motion/react'
import { authFetch } from './authFetch'
import { API_URL } from './config'
import { useGym } from './GymContext'
import './AnalyticsPage.css'

const endpoints = ['overview', 'retention', 'financial', 'memberships', 'growth', 'branches']

const rangeOptions = [
  { value: 'this_month', label: 'This Month' },
  { value: 'last_month', label: 'Last Month' },
  { value: '3m', label: '3 Months' },
  { value: '6m', label: '6 Months' },
  { value: 'this_year', label: 'This Year' },
  { value: 'custom', label: 'Custom' }
]

// Motion presets conforming to skill guidelines
const snappy = { type: 'spring', stiffness: 400, damping: 25 }
const smooth = { type: 'spring', stiffness: 260, damping: 20 }
const kpiSpring = { type: 'spring', stiffness: 400, damping: 17 }

export default function AnalyticsPage() {
  const { gym } = useGym()
  const reduceMotion = useReducedMotion()

  const [range, setRange] = useState('6m')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedCustomDates, setAppliedCustomDates] = useState({ start: '', end: '' })
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTableTab, setActiveTableTab] = useState('plans')

  const currency = gym?.currency || 'USD'

  const formatMoney = useCallback((value) => {
    try {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }).format(value || 0)
    } catch {
      return `${currency} ${(value || 0).toLocaleString()}`
    }
  }, [currency])

  const formatChartLabel = useCallback((label) => {
    if (!label) return ''
    if (/^\d{4}-\d{2}$/.test(label)) {
      const [year, month] = label.split('-')
      const d = new Date(Number(year), Number(month) - 1, 1)
      const monthName = d.toLocaleDateString('en-US', { month: 'short' })
      return `${monthName} '${year.slice(2)}`
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
      const [year, month, day] = label.split('-')
      const d = new Date(Number(year), Number(month) - 1, Number(day))
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    }
    return label
  }, [])

  const formatDateRangeLabel = (rangeObj) => {
    if (!rangeObj?.start_date || !rangeObj?.end_date) return null
    try {
      const s = new Date(rangeObj.start_date + 'T00:00:00')
      const e = new Date(rangeObj.end_date + 'T00:00:00')
      const opt = { month: 'short', day: 'numeric', year: 'numeric' }
      return `${s.toLocaleDateString(undefined, opt)} – ${e.toLocaleDateString(undefined, opt)}`
    } catch {
      return `${rangeObj.start_date} to ${rangeObj.end_date}`
    }
  }

  const loadAnalytics = useCallback(() => {
    if (range === 'custom') {
      const activeStart = appliedCustomDates.start || startDate
      const activeEnd = appliedCustomDates.end || endDate
      if (!activeStart || !activeEnd) {
        setLoading(false)
        setError('Please select both start and end dates for a custom range.')
        return
      }
    }

    setLoading(true)
    setError('')

    const params = new URLSearchParams({ range })
    if (range === 'custom') {
      params.set('start_date', appliedCustomDates.start || startDate)
      params.set('end_date', appliedCustomDates.end || endDate)
    }

    Promise.all(endpoints.map(async (endpoint) => {
      const response = await authFetch(`${API_URL}/analytics/${endpoint}?${params}`)
      const body = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(body.error || `Failed to load ${endpoint} analytics.`)
      }
      return [endpoint, body]
    }))
      .then((results) => {
        setData(Object.fromEntries(results))
      })
      .catch((err) => {
        setError(err.message || 'Unable to retrieve gym analytics data.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [range, appliedCustomDates, startDate, endDate])

  useEffect(() => {
    const timer = setTimeout(loadAnalytics, 0)
    return () => clearTimeout(timer)
  }, [loadAnalytics])

  const handleApplyCustomRange = (e) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError('Please choose both start and end dates.')
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError('End date must be on or after start date.')
      return
    }
    setError('')
    setAppliedCustomDates({ start: startDate, end: endDate })
  }

  // Analytics datasets
  const overview = data.overview || {}
  const retention = data.retention || {}
  const financial = data.financial || {}
  const memberships = data.memberships || {}
  const growth = data.growth || {}
  const branches = data.branches || {}

  // Computed Growth metrics
  const memberGrowthPct = overview.member_growth_percent
  const revGrowthPct = overview.revenue_change_percent

  // Animations configuration
  const sectionVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 16 },
    visible: { opacity: 1, y: 0, transition: smooth }
  }

  const kpiContainerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: reduceMotion ? 0 : 0.06,
        delayChildren: reduceMotion ? 0 : 0.04
      }
    }
  }

  const kpiCardVariants = {
    hidden: { opacity: 0, y: reduceMotion ? 0 : 12, scale: reduceMotion ? 1 : 0.98 },
    visible: { opacity: 1, y: 0, scale: 1, transition: snappy }
  }

  const dateRangeDisplay = formatDateRangeLabel(overview.range || financial.range)

  return (
    <div className="analytics-container">
      {/* ============================================================
          1. ANALYTICS HEADER & CONTROLS
          ============================================================ */}
      <motion.header
        className="analytics-header-card"
        initial="hidden"
        animate="visible"
        variants={sectionVariants}
      >
        <div className="analytics-header-content">
          <div className="analytics-header-title-group">
            <div className="analytics-eyebrow-badge">
              <span className="analytics-pulse-dot" />
              <span>Operational Intelligence</span>
            </div>
            <h1>Gym Analytics & Performance</h1>
            <p className="analytics-subtitle">
              Real-time executive oversight across revenue velocity, membership retention, plan performance, and multi-branch yield.
            </p>
          </div>

          <div className="analytics-controls-toolbar">
            <div className="analytics-toolbar-actions">
              {/* Segmented Range Controls */}
              <nav className="analytics-segmented-nav" aria-label="Date range selection">
                {rangeOptions.map((opt) => {
                  const isActive = range === opt.value
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      className={`analytics-segment-btn ${isActive ? 'active' : ''}`}
                      onClick={() => setRange(opt.value)}
                      aria-pressed={isActive}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="activeRangeTab"
                          className="analytics-segment-active-pill"
                          transition={reduceMotion ? { duration: 0 } : snappy}
                        />
                      )}
                      <span>{opt.label}</span>
                    </button>
                  )
                })}
              </nav>

              {/* Refresh Action */}
              <motion.button
                type="button"
                className="analytics-refresh-btn"
                onClick={loadAnalytics}
                disabled={loading}
                title="Refresh analytics data"
                whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={snappy}
              >
                <RefreshCw size={14} className={loading ? 'analytics-spinning-icon' : ''} />
                <span>{loading ? 'Refreshing' : 'Refresh'}</span>
              </motion.button>
            </div>

            {dateRangeDisplay && (
              <div className="analytics-date-range-badge">
                <Calendar size={12} />
                <span>{dateRangeDisplay}</span>
              </div>
            )}
          </div>
        </div>

        {/* Custom Range Drawer */}
        <AnimatePresence>
          {range === 'custom' && (
            <motion.form
              className="analytics-custom-date-drawer"
              onSubmit={handleApplyCustomRange}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={smooth}
            >
              <div className="analytics-custom-date-inputs">
                <label className="analytics-date-field">
                  <span>Start Date:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </label>
                <label className="analytics-date-field">
                  <span>End Date:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    required
                  />
                </label>
                <motion.button
                  type="submit"
                  className="analytics-custom-apply-btn"
                  whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                  whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                  transition={snappy}
                >
                  Apply Custom Range
                </motion.button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </motion.header>

      {/* ============================================================
          ERROR BANNER
          ============================================================ */}
      <AnimatePresence>
        {error && (
          <motion.div
            className="analytics-error-banner"
            role="alert"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={snappy}
          >
            <div className="analytics-error-left">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button
              type="button"
              className="analytics-error-retry-btn"
              onClick={loadAnalytics}
            >
              <RefreshCw size={12} />
              <span>Try Again</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          LOADING SKELETON OR CONTENT
          ============================================================ */}
      {loading && !data.overview ? (
        <AnalyticsLoadingSkeleton />
      ) : (
        <>
          {/* ============================================================
              2. EXECUTIVE KPI CARDS (Strong Visual Hierarchy)
              ============================================================ */}
          <motion.section
            className="analytics-section"
            initial="hidden"
            animate="visible"
            variants={kpiContainerVariants}
            aria-label="Executive Key Performance Indicators"
          >
            <div className="analytics-kpi-grid">
              {/* PRIMARY 1: Recorded Revenue (Featured) */}
              <motion.article
                className="analytics-kpi-card featured"
                variants={kpiCardVariants}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={kpiSpring}
              >
                <div className="analytics-kpi-header">
                  <div className="analytics-kpi-label-group">
                    <div className="analytics-kpi-icon-wrap">
                      <CreditCard size={18} />
                    </div>
                    <span className="analytics-kpi-label">Recorded Revenue</span>
                  </div>
                  {revGrowthPct != null ? (
                    <span className={`analytics-kpi-badge ${revGrowthPct >= 0 ? 'positive' : 'negative'}`}>
                      {revGrowthPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{revGrowthPct > 0 ? `+${revGrowthPct}%` : `${revGrowthPct}%`}</span>
                    </span>
                  ) : (
                    <span className="analytics-kpi-badge neutral">
                      <span>Baseline</span>
                    </span>
                  )}
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {formatMoney(overview.revenue)}
                  </div>
                  <p className="analytics-kpi-note">
                    {overview.revenue_previous_period != null && overview.revenue_previous_period > 0
                      ? `vs. ${formatMoney(overview.revenue_previous_period)} in previous period`
                      : 'Total payment records in this range'}
                  </p>
                </div>
              </motion.article>

              {/* PRIMARY 2: Active Members (Featured) */}
              <motion.article
                className="analytics-kpi-card featured"
                variants={kpiCardVariants}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={kpiSpring}
              >
                <div className="analytics-kpi-header">
                  <div className="analytics-kpi-label-group">
                    <div className="analytics-kpi-icon-wrap">
                      <Activity size={18} />
                    </div>
                    <span className="analytics-kpi-label">Active Members</span>
                  </div>
                  <span className="analytics-kpi-badge positive">
                    <CheckCircle2 size={12} />
                    <span>
                      {overview.total_members > 0
                        ? `${Math.round(((overview.active_members || 0) / overview.total_members) * 100)}% valid`
                        : 'Current'}
                    </span>
                  </span>
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {(overview.active_members || 0).toLocaleString()}
                  </div>
                  <p className="analytics-kpi-note">
                    Out of {(overview.total_members || 0).toLocaleString()} total registered members
                  </p>
                  <div className="analytics-kpi-progress">
                    <div
                      className="analytics-kpi-progress-bar"
                      style={{
                        width: overview.total_members > 0
                          ? `${Math.min(100, Math.round(((overview.active_members || 0) / overview.total_members) * 100))}%`
                          : '0%'
                      }}
                    />
                  </div>
                </div>
              </motion.article>

              {/* SECONDARY 1: New Member Growth */}
              <motion.article
                className="analytics-kpi-card secondary"
                variants={kpiCardVariants}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={kpiSpring}
              >
                <div className="analytics-kpi-header">
                  <div className="analytics-kpi-label-group">
                    <div className="analytics-kpi-icon-wrap">
                      <Users size={16} />
                    </div>
                    <span className="analytics-kpi-label">New Registrations</span>
                  </div>
                  {memberGrowthPct != null ? (
                    <span className={`analytics-kpi-badge ${memberGrowthPct >= 0 ? 'positive' : 'negative'}`}>
                      {memberGrowthPct >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      <span>{memberGrowthPct > 0 ? `+${memberGrowthPct}%` : `${memberGrowthPct}%`}</span>
                    </span>
                  ) : (
                    <span className="analytics-kpi-badge neutral">
                      <span>{overview.member_growth ?? 0} joins</span>
                    </span>
                  )}
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {(overview.new_members || 0).toLocaleString()}
                  </div>
                  <p className="analytics-kpi-note">
                    {overview.new_members_previous_period != null
                      ? `${overview.new_members_previous_period} new members in prior cycle`
                      : 'New joins recorded in period'}
                  </p>
                </div>
              </motion.article>

              {/* SECONDARY 2: Paying Members & ARPU */}
              <motion.article
                className="analytics-kpi-card secondary"
                variants={kpiCardVariants}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={kpiSpring}
              >
                <div className="analytics-kpi-header">
                  <div className="analytics-kpi-label-group">
                    <div className="analytics-kpi-icon-wrap">
                      <DollarSign size={16} />
                    </div>
                    <span className="analytics-kpi-label">Paying Members</span>
                  </div>
                  <span className="analytics-kpi-badge neutral">
                    <span>Transacted</span>
                  </span>
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {(financial.paying_members || 0).toLocaleString()}
                  </div>
                  <p className="analytics-kpi-note">
                    Avg. <strong>{formatMoney(financial.average_revenue_per_paying_member)}</strong> per paying member
                  </p>
                </div>
              </motion.article>

              {/* SECONDARY 3: Expired Memberships */}
              <motion.article
                className="analytics-kpi-card secondary"
                variants={kpiCardVariants}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={kpiSpring}
              >
                <div className="analytics-kpi-header">
                  <div className="analytics-kpi-label-group">
                    <div className="analytics-kpi-icon-wrap">
                      <CalendarDays size={16} />
                    </div>
                    <span className="analytics-kpi-label">Expired Terms</span>
                  </div>
                  {(overview.expired_memberships || 0) > 0 ? (
                    <span className="analytics-kpi-badge negative">
                      <span>Action needed</span>
                    </span>
                  ) : (
                    <span className="analytics-kpi-badge positive">
                      <span>Up to date</span>
                    </span>
                  )}
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {(overview.expired_memberships || 0).toLocaleString()}
                  </div>
                  <p className="analytics-kpi-note">
                    Memberships expired requiring renewal
                  </p>
                </div>
              </motion.article>

              {/* SUPPORTING: Lifetime Recorded Revenue */}
              <motion.article
                className="analytics-kpi-card supporting"
                variants={kpiCardVariants}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={kpiSpring}
              >
                <div className="analytics-kpi-header">
                  <div className="analytics-kpi-label-group">
                    <div className="analytics-kpi-icon-wrap">
                      <Sparkles size={16} />
                    </div>
                    <span className="analytics-kpi-label">Lifetime Gym Revenue</span>
                  </div>
                  <span className="analytics-kpi-badge neutral">
                    <span>Cumulative</span>
                  </span>
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {formatMoney(overview.total_recorded_revenue)}
                  </div>
                  <p className="analytics-kpi-note">
                    All-time recorded payment volume since launch
                  </p>
                </div>
              </motion.article>

              {/* SUPPORTING: Total Member Directory */}
              <motion.article
                className="analytics-kpi-card supporting"
                variants={kpiCardVariants}
                whileHover={reduceMotion ? undefined : { scale: 1.02 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={kpiSpring}
              >
                <div className="analytics-kpi-header">
                  <div className="analytics-kpi-label-group">
                    <div className="analytics-kpi-icon-wrap">
                      <Users size={16} />
                    </div>
                    <span className="analytics-kpi-label">Total Member Roster</span>
                  </div>
                  <span className="analytics-kpi-badge neutral">
                    <span>All-Time</span>
                  </span>
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {(overview.total_members || 0).toLocaleString()}
                  </div>
                  <p className="analytics-kpi-note">
                    Cumulative registered members across all facilities
                  </p>
                </div>
              </motion.article>
            </div>
          </motion.section>

          {/* ============================================================
              3. CHARTS SECTION: Revenue Trajectory + Member Growth
              ============================================================ */}
          <motion.section
            className="analytics-section"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <div className="analytics-section-header">
              <div className="analytics-section-title-wrap">
                <div className="analytics-section-icon">
                  <TrendingUp size={16} />
                </div>
                <div className="analytics-section-heading">
                  <h2>Financial & Acquisition Dynamics</h2>
                  <p>Revenue collections trend alongside new member velocity over the selected timeframe.</p>
                </div>
              </div>
            </div>

            <div className="analytics-charts-dual-grid">
              {/* Chart 1: Revenue Line/Area Chart */}
              <article className="analytics-panel-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>Revenue Trend</h3>
                    <p>Collections timeline by period</p>
                  </div>
                  <div className="analytics-panel-stat-pill">
                    {formatMoney(financial.revenue)}
                  </div>
                </div>

                <RevenueTrendChart
                  rows={financial.trend}
                  formatMoney={formatMoney}
                  formatChartLabel={formatChartLabel}
                />
              </article>

              {/* Chart 2: Member Growth Bar Chart */}
              <article className="analytics-panel-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>New Member Acquisition</h3>
                    <p>Registrations grouped by join date</p>
                  </div>
                  <div className="analytics-panel-stat-pill">
                    {(overview.new_members || 0)} Joins
                  </div>
                </div>

                <MemberGrowthBarChart
                  rows={growth.new_members}
                  formatChartLabel={formatChartLabel}
                />
              </article>
            </div>
          </motion.section>

          {/* ============================================================
              4. RETENTION & MEMBERSHIP PERFORMANCE SECTION
              ============================================================ */}
          <motion.section
            className="analytics-section"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <div className="analytics-section-header">
              <div className="analytics-section-title-wrap">
                <div className="analytics-section-icon">
                  <Activity size={16} />
                </div>
                <div className="analytics-section-heading">
                  <h2>Retention & Membership Health</h2>
                  <p>Current membership status distribution alongside plan popularity.</p>
                </div>
              </div>
            </div>

            <div className="analytics-charts-dual-grid">
              {/* Retention Health Card */}
              <article className="analytics-panel-card analytics-health-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>Membership Lifecycle Status</h3>
                    <p>Current status breakdown of member base</p>
                  </div>
                </div>

                <RetentionDistributionWidget retention={retention} />

                {retention.unavailable_reason && (
                  <div className="analytics-schema-callout">
                    <Info size={14} />
                    <span>{retention.unavailable_reason}</span>
                  </div>
                )}
              </article>

              {/* Plan Popularity Card */}
              <article className="analytics-panel-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>Plan Performance</h3>
                    <p>Active members and recorded volume by plan</p>
                  </div>
                  {memberships.most_popular_plan && (
                    <span className="analytics-status-pill success">
                      <Sparkles size={11} />
                      <span>Top: {memberships.most_popular_plan}</span>
                    </span>
                  )}
                </div>

                <PlanPerformanceWidget
                  plans={memberships.plans}
                  formatMoney={formatMoney}
                />

                {memberships.unavailable_reason && (
                  <div className="analytics-schema-callout">
                    <Info size={14} />
                    <span>{memberships.unavailable_reason}</span>
                  </div>
                )}
              </article>
            </div>
          </motion.section>

          {/* ============================================================
              5. BRANCH PERFORMANCE SECTION
              ============================================================ */}
          <motion.section
            className="analytics-section"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <div className="analytics-section-header">
              <div className="analytics-section-title-wrap">
                <div className="analytics-section-icon">
                  <Building2 size={16} />
                </div>
                <div className="analytics-section-heading">
                  <h2>Branch Performance & Facilities</h2>
                  <p>Member distribution and recorded revenue across gym locations.</p>
                </div>
              </div>
            </div>

            <div className="analytics-charts-dual-grid">
              <article className="analytics-panel-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>Members by Branch</h3>
                    <p>Total and active membership distribution</p>
                  </div>
                  <div className="analytics-panel-stat-pill">
                    {branches.branches?.length || 0} Facilities
                  </div>
                </div>

                <BranchComparisonWidget
                  branches={branches.branches}
                />
              </article>

              <article className="analytics-panel-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>Branch Revenue Breakdown</h3>
                    <p>Recorded revenue attributed to each facility</p>
                  </div>
                </div>

                <BranchRevenueWidget
                  branches={branches.branches}
                  formatMoney={formatMoney}
                />

                {branches.unavailable_reason && (
                  <div className="analytics-schema-callout">
                    <Info size={14} />
                    <span>{branches.unavailable_reason}</span>
                  </div>
                )}
              </article>
            </div>
          </motion.section>

          {/* ============================================================
              6. DETAILED AUDIT TABLES SECTION
              ============================================================ */}
          <motion.section
            className="analytics-section"
            initial="hidden"
            animate="visible"
            variants={sectionVariants}
          >
            <div className="analytics-table-card">
              <div className="analytics-table-header-bar">
                <div className="analytics-section-title-wrap">
                  <div className="analytics-section-icon">
                    <Layers size={16} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>Operational Breakdown</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      Granular operational metrics by membership plan and facility branch.
                    </p>
                  </div>
                </div>

                {/* Table View Tab Selector */}
                <div className="analytics-segmented-nav" style={{ padding: 2 }}>
                  <button
                    type="button"
                    className={`analytics-segment-btn ${activeTableTab === 'plans' ? 'active' : ''}`}
                    onClick={() => setActiveTableTab('plans')}
                  >
                    {activeTableTab === 'plans' && (
                      <motion.div
                        layoutId="activeTableTabPill"
                        className="analytics-segment-active-pill"
                        transition={snappy}
                      />
                    )}
                    <span>Membership Plans</span>
                  </button>
                  <button
                    type="button"
                    className={`analytics-segment-btn ${activeTableTab === 'branches' ? 'active' : ''}`}
                    onClick={() => setActiveTableTab('branches')}
                  >
                    {activeTableTab === 'branches' && (
                      <motion.div
                        layoutId="activeTableTabPill"
                        className="analytics-segment-active-pill"
                        transition={snappy}
                      />
                    )}
                    <span>Branches</span>
                  </button>
                </div>
              </div>

              {activeTableTab === 'plans' ? (
                <div className="analytics-table-scroll-wrap">
                  <table className="analytics-modern-table" aria-label="Membership plans detailed table">
                    <thead>
                      <tr>
                        <th>Plan Name</th>
                        <th>Active Members</th>
                        <th>Expired</th>
                        <th>Expiring Soon (&lt; 8 days)</th>
                        <th>Avg Term Duration</th>
                        <th>Recorded Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(memberships.plans || []).length > 0 ? (
                        memberships.plans.map((plan) => (
                          <tr key={plan.plan_id}>
                            <td className="primary-cell">{plan.plan_name}</td>
                            <td className="numeric-cell">{plan.active || 0}</td>
                            <td className="numeric-cell">{plan.expired || 0}</td>
                            <td className="numeric-cell">
                              {plan.expiring_soon > 0 ? (
                                <span className="analytics-status-pill warning">
                                  {plan.expiring_soon} soon
                                </span>
                              ) : (
                                '0'
                              )}
                            </td>
                            <td>
                              {plan.average_recorded_term_days != null
                                ? `${plan.average_recorded_term_days} days`
                                : '—'}
                            </td>
                            <td className="numeric-cell">{formatMoney(plan.recorded_revenue)}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6}>
                            <div className="analytics-empty-state">
                              <div className="analytics-empty-icon-wrap">
                                <CreditCard size={24} />
                              </div>
                              <h4>No Membership Plans Found</h4>
                              <p>Add membership plans to view comprehensive plan analytics.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="analytics-table-scroll-wrap">
                  <table className="analytics-modern-table" aria-label="Branch operations detailed table">
                    <thead>
                      <tr>
                        <th>Facility Branch</th>
                        <th>Total Members</th>
                        <th>Active Members</th>
                        <th>New Members (Range)</th>
                        <th>Recorded Revenue</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(branches.branches || []).length > 0 ? (
                        branches.branches.map((b) => (
                          <tr key={b.branch_id}>
                            <td className="primary-cell">{b.branch_name}</td>
                            <td className="numeric-cell">{b.total_members || 0}</td>
                            <td className="numeric-cell">{b.active_members || 0}</td>
                            <td className="numeric-cell">{b.new_members || 0}</td>
                            <td className="numeric-cell">{formatMoney(b.recorded_revenue)}</td>
                            <td>
                              <span className="analytics-status-pill muted">
                                Operational
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6}>
                            <div className="analytics-empty-state">
                              <div className="analytics-empty-icon-wrap">
                                <Building2 size={24} />
                              </div>
                              <h4>No Branches Found</h4>
                              <p>Register gym branches to monitor location-specific operations.</p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </motion.section>
        </>
      )}
    </div>
  )
}

/* ==========================================================================
   SUBCOMPONENTS: CHARTS & WIDGETS
   ========================================================================== */

/**
 * Modern SVG Area & Line Chart for Revenue Trend with interactive tooltips
 */
function RevenueTrendChart({ rows = [], formatMoney, formatChartLabel }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const chartGradientId = useId()

  const hasData = rows.length > 0 && rows.some((r) => Number(r.revenue) > 0)

  if (!hasData) {
    return (
      <div className="analytics-empty-state">
        <div className="analytics-empty-icon-wrap">
          <CreditCard size={24} />
        </div>
        <h4>No financial data yet</h4>
        <p>Once payments are recorded, your revenue analytics will appear here.</p>
      </div>
    )
  }

  const width = 640
  const height = 200
  const paddingBottom = 24
  const paddingTop = 16
  const paddingLeft = 40
  const paddingRight = 16

  const usableWidth = width - paddingLeft - paddingRight
  const usableHeight = height - paddingTop - paddingBottom

  const values = rows.map((r) => Number(r.revenue) || 0)
  const max = Math.max(...values, 1)

  const points = values.map((val, idx) => {
    const x = rows.length === 1 ? paddingLeft + usableWidth / 2 : paddingLeft + (idx * usableWidth) / (rows.length - 1)
    const y = paddingTop + usableHeight - (val / max) * usableHeight
    return { x, y, value: val, label: rows[idx].label }
  })

  const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${paddingTop + usableHeight} L ${points[0].x} ${paddingTop + usableHeight} Z`

  return (
    <div className="analytics-chart-container">
      <svg
        className="analytics-chart-svg"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="Revenue trajectory line chart"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id={chartGradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.25" />
            <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Guide Gridlines */}
        <line x1={paddingLeft} y1={paddingTop} x2={width - paddingRight} y2={paddingTop} className="analytics-grid-line" />
        <line x1={paddingLeft} y1={paddingTop + usableHeight / 2} x2={width - paddingRight} y2={paddingTop + usableHeight / 2} className="analytics-grid-line" />
        <line x1={paddingLeft} y1={paddingTop + usableHeight} x2={width - paddingRight} y2={paddingTop + usableHeight} className="analytics-grid-line" />

        {/* Axis Value Labels */}
        <text x={paddingLeft - 8} y={paddingTop + 4} textAnchor="end" className="analytics-axis-label">{formatMoney(max)}</text>
        <text x={paddingLeft - 8} y={paddingTop + usableHeight / 2 + 4} textAnchor="end" className="analytics-axis-label">{formatMoney(max / 2)}</text>
        <text x={paddingLeft - 8} y={paddingTop + usableHeight + 4} textAnchor="end" className="analytics-axis-label">{formatMoney(0)}</text>

        {/* Filled Area */}
        <path d={areaPath} fill={`url(#${chartGradientId})`} />

        {/* Stroke Line */}
        <path
          d={linePath}
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Interactive Data Dots */}
        {points.map((p, idx) => (
          <circle
            key={idx}
            cx={p.x}
            cy={p.y}
            r="4.5"
            fill="var(--surface)"
            stroke="var(--accent)"
            strokeWidth="2.5"
            className="analytics-chart-point"
            onMouseEnter={() => setHoveredPoint(p)}
            onMouseLeave={() => setHoveredPoint(null)}
          />
        ))}
      </svg>

      {/* Floating Hover Tooltip */}
      {hoveredPoint && (
        <div className="analytics-chart-tooltip">
          <span className="analytics-tooltip-date">{formatChartLabel ? formatChartLabel(hoveredPoint.label) : hoveredPoint.label}</span>
          <span className="analytics-tooltip-value">{formatMoney(hoveredPoint.value)}</span>
        </div>
      )}

      {/* X-Axis Endpoint Labels */}
      <div className="analytics-chart-x-labels">
        <span>{formatChartLabel ? formatChartLabel(rows[0]?.label) : rows[0]?.label}</span>
        {rows.length > 2 && <span>{formatChartLabel ? formatChartLabel(rows[Math.floor(rows.length / 2)]?.label) : rows[Math.floor(rows.length / 2)]?.label}</span>}
        <span>{formatChartLabel ? formatChartLabel(rows[rows.length - 1]?.label) : rows[rows.length - 1]?.label}</span>
      </div>
    </div>
  )
}

/**
 * Member Acquisition Bar Chart
 */
function MemberGrowthBarChart({ rows = [], formatChartLabel }) {
  const hasData = rows.length > 0 && rows.some((r) => Number(r.count) > 0)

  if (!hasData) {
    return (
      <div className="analytics-empty-state">
        <div className="analytics-empty-icon-wrap">
          <Users size={24} />
        </div>
        <h4>No new member joins recorded</h4>
        <p>As members join during this date range, their registration volume will plot here.</p>
      </div>
    )
  }

  const values = rows.map((r) => Number(r.count) || 0)
  const max = Math.max(...values, 1)

  return (
    <div className="analytics-bar-chart-wrap">
      {rows.map((row, idx) => {
        const count = Number(row.count) || 0
        const heightPct = count > 0 ? Math.max(8, Math.round((count / max) * 100)) : 3
        const formattedLabel = formatChartLabel ? formatChartLabel(row.label) : row.label
        return (
          <div key={idx} className="analytics-bar-col" title={`${formattedLabel}: ${count} joins`}>
            {count > 0 && <span className="analytics-bar-val-badge">{count}</span>}
            <div className="analytics-bar-track">
              <div
                className="analytics-bar-fill"
                style={{ height: `${heightPct}%`, opacity: count === 0 ? 0.3 : 1 }}
              />
            </div>
            <span className="analytics-bar-label">{formattedLabel}</span>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Retention Distribution Widget
 */
function RetentionDistributionWidget({ retention = {} }) {
  const active = retention.current_active_memberships || 0
  const expired = retention.current_expired_memberships || 0
  const cancelled = retention.explicitly_cancelled_memberships || 0
  const none = retention.members_without_membership_record || 0
  const total = active + expired + cancelled + none

  return (
    <div className="analytics-distribution-bar-wrap">
      <div className="analytics-distribution-labels">
        <span>Active ({active})</span>
        <span>Expired ({expired})</span>
        <span>Cancelled ({cancelled})</span>
        <span>None ({none})</span>
      </div>

      <div className="analytics-distribution-bar">
        {total > 0 ? (
          <>
            <div className="analytics-dist-segment active" style={{ width: `${(active / total) * 100}%` }} title={`Active: ${active}`} />
            <div className="analytics-dist-segment expired" style={{ width: `${(expired / total) * 100}%` }} title={`Expired: ${expired}`} />
            <div className="analytics-dist-segment cancelled" style={{ width: `${(cancelled / total) * 100}%` }} title={`Cancelled: ${cancelled}`} />
            <div className="analytics-dist-segment none" style={{ width: `${(none / total) * 100}%` }} title={`No membership: ${none}`} />
          </>
        ) : (
          <div className="analytics-dist-segment none" style={{ width: '100%' }} />
        )}
      </div>

      <div className="analytics-health-tiles-grid" style={{ marginTop: 18 }}>
        <div className="analytics-health-tile active">
          <span className="analytics-health-tile-title">Currently Active</span>
          <span className="analytics-health-tile-val">{active}</span>
        </div>
        <div className="analytics-health-tile expired">
          <span className="analytics-health-tile-title">Currently Expired</span>
          <span className="analytics-health-tile-val">{expired}</span>
        </div>
        <div className="analytics-health-tile cancelled">
          <span className="analytics-health-tile-title">Explicitly Cancelled</span>
          <span className="analytics-health-tile-val">{cancelled}</span>
        </div>
        <div className="analytics-health-tile none">
          <span className="analytics-health-tile-title">No Membership Record</span>
          <span className="analytics-health-tile-val">{none}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Plan Performance Widget
 */
function PlanPerformanceWidget({ plans = [], formatMoney }) {
  if (!plans.length) {
    return (
      <div className="analytics-empty-state">
        <div className="analytics-empty-icon-wrap">
          <CreditCard size={24} />
        </div>
        <h4>No membership plans configured</h4>
        <p>Create membership plans to monitor adoption and active members.</p>
      </div>
    )
  }

  const maxActive = Math.max(...plans.map((p) => p.active || 0), 1)

  return (
    <div className="analytics-ranked-list">
      {plans.map((plan) => {
        const pct = Math.max(5, Math.round(((plan.active || 0) / maxActive) * 100))
        return (
          <div key={plan.plan_id} className="analytics-ranked-item">
            <div className="analytics-ranked-top">
              <span className="analytics-ranked-name">{plan.plan_name}</span>
              <span className="analytics-ranked-metric">
                {plan.active || 0} active
              </span>
            </div>
            <div className="analytics-ranked-track">
              <div className="analytics-ranked-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="analytics-ranked-top analytics-ranked-sub">
              <span>{formatMoney(plan.recorded_revenue)} recorded</span>
              <span>{plan.expired || 0} expired • {plan.expiring_soon || 0} due soon</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Branch Comparison Widget
 */
function BranchComparisonWidget({ branches = [] }) {
  if (!branches.length) {
    return (
      <div className="analytics-empty-state">
        <div className="analytics-empty-icon-wrap">
          <Building2 size={24} />
        </div>
        <h4>No branches registered</h4>
        <p>Set up gym facilities to observe location comparisons.</p>
      </div>
    )
  }

  const maxMembers = Math.max(...branches.map((b) => b.total_members || 0), 1)

  return (
    <div className="analytics-ranked-list">
      {branches.map((b) => {
        const pct = Math.max(4, Math.round(((b.total_members || 0) / maxMembers) * 100))
        return (
          <div key={b.branch_id} className="analytics-ranked-item">
            <div className="analytics-ranked-top">
              <span className="analytics-ranked-name">
                <Building2 size={13} style={{ opacity: 0.6 }} />
                {b.branch_name}
              </span>
              <span className="analytics-ranked-metric">
                {b.total_members || 0} members
              </span>
            </div>
            <div className="analytics-ranked-track">
              <div className="analytics-ranked-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="analytics-ranked-top analytics-ranked-sub">
              <span>{b.active_members || 0} active members</span>
              <span>{b.new_members || 0} new in period</span>
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Branch Revenue Widget
 */
function BranchRevenueWidget({ branches = [], formatMoney }) {
  const hasRevenue = branches.some((b) => Number(b.recorded_revenue) > 0)
  const maxRevenue = Math.max(...branches.map((b) => Number(b.recorded_revenue) || 0), 1)

  if (!hasRevenue) {
    return (
      <div className="analytics-empty-state">
        <div className="analytics-empty-icon-wrap">
          <DollarSign size={24} />
        </div>
        <h4>No branch revenue recorded in this period</h4>
        <p>Payments recorded for members will attribute revenue to their respective home branch.</p>
      </div>
    )
  }

  return (
    <div className="analytics-ranked-list">
      {branches.map((b) => {
        const rev = Number(b.recorded_revenue) || 0
        const pct = Math.max(4, Math.round((rev / maxRevenue) * 100))
        return (
          <div key={b.branch_id} className="analytics-ranked-item">
            <div className="analytics-ranked-top">
              <span className="analytics-ranked-name">{b.branch_name}</span>
              <span className="analytics-ranked-metric">{formatMoney(rev)}</span>
            </div>
            <div className="analytics-ranked-track">
              <div className="analytics-ranked-fill" style={{ width: `${pct}%` }} />
            </div>
          </div>
        )
      })}
    </div>
  )
}

/**
 * Skeleton Loading Placeholder (Zero Layout Jump)
 */
function AnalyticsLoadingSkeleton() {
  return (
    <div className="analytics-skeleton-wrapper" aria-busy="true" aria-label="Loading analytics data">
      <div className="analytics-kpi-grid">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className={`analytics-kpi-card ${i <= 2 ? 'featured' : i <= 4 ? 'secondary' : 'supporting'}`}
          >
            <div className="analytics-skeleton-shimmer" style={{ width: 120, height: 16, marginBottom: 12 }} />
            <div className="analytics-skeleton-shimmer analytics-skeleton-kpi-val" />
            <div className="analytics-skeleton-shimmer analytics-skeleton-kpi-note" />
          </div>
        ))}
      </div>

      <div className="analytics-charts-dual-grid" style={{ marginBottom: 24 }}>
        <div className="analytics-panel-card">
          <div className="analytics-skeleton-shimmer" style={{ width: 160, height: 20, marginBottom: 16 }} />
          <div className="analytics-skeleton-shimmer analytics-skeleton-chart" />
        </div>
        <div className="analytics-panel-card">
          <div className="analytics-skeleton-shimmer" style={{ width: 160, height: 20, marginBottom: 16 }} />
          <div className="analytics-skeleton-shimmer analytics-skeleton-chart" />
        </div>
      </div>
    </div>
  )
}
