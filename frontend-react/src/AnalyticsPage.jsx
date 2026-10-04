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
import { useTranslation } from 'react-i18next'
import { authFetch } from './authFetch'
import { API_URL } from './config'
import { useGym } from './GymContext'
import './AnalyticsPage.css'

const endpoints = ['overview', 'retention', 'financial', 'memberships', 'growth', 'branches']

// Motion presets conforming to skill guidelines
const snappy = { type: 'spring', stiffness: 400, damping: 25 }
const smooth = { type: 'spring', stiffness: 260, damping: 20 }
const kpiSpring = { type: 'spring', stiffness: 400, damping: 17 }

export default function AnalyticsPage() {
  const { gym } = useGym()
  const reduceMotion = useReducedMotion()
  const { t, i18n } = useTranslation(['analytics', 'common'])

  const [range, setRange] = useState('6m')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [appliedCustomDates, setAppliedCustomDates] = useState({ start: '', end: '' })
  const [data, setData] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeTableTab, setActiveTableTab] = useState('plans')

  const currency = gym?.currency || 'USD'

  const rangeOptions = [
    { value: 'this_month', label: t('thisMonth') },
    { value: 'last_month', label: t('lastMonth') },
    { value: '3m', label: t('threeMonths') },
    { value: '6m', label: t('sixMonths') },
    { value: 'this_year', label: t('thisYear') },
    { value: 'custom', label: t('custom') }
  ]

  const formatMoney = useCallback((value) => {
    const locale = i18n.language === 'am' ? 'am-ET' : 'en-US'
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0
      }).format(value || 0)
    } catch {
      return `${currency} ${(value || 0).toLocaleString(locale)}`
    }
  }, [currency, i18n.language])

  const formatChartLabel = useCallback((label) => {
    if (!label) return ''
    const locale = i18n.language === 'am' ? 'am-ET' : 'en-US'
    if (/^\d{4}-\d{2}$/.test(label)) {
      const [year, month] = label.split('-')
      const d = new Date(Number(year), Number(month) - 1, 1)
      const monthName = d.toLocaleDateString(locale, { month: 'short' })
      return `${monthName} '${year.slice(2)}`
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(label)) {
      const [year, month, day] = label.split('-')
      const d = new Date(Number(year), Number(month) - 1, Number(day))
      return d.toLocaleDateString(locale, { month: 'short', day: 'numeric' })
    }
    return label
  }, [i18n.language])

  const formatDateRangeLabel = (rangeObj) => {
    if (!rangeObj?.start_date || !rangeObj?.end_date) return null
    try {
      const s = new Date(rangeObj.start_date + 'T00:00:00')
      const e = new Date(rangeObj.end_date + 'T00:00:00')
      const opt = { month: 'short', day: 'numeric', year: 'numeric' }
      const locale = i18n.language === 'am' ? 'am-ET' : 'en-US'
      return `${s.toLocaleDateString(locale, opt)} – ${e.toLocaleDateString(locale, opt)}`
    } catch {
      return `${rangeObj.start_date} – ${rangeObj.end_date}`
    }
  }

  const loadAnalytics = useCallback(() => {
    if (range === 'custom') {
      const activeStart = appliedCustomDates.start || startDate
      const activeEnd = appliedCustomDates.end || endDate
      if (!activeStart || !activeEnd) {
        setLoading(false)
        setError(t('customRangeError'))
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
        throw new Error(body.error || t('common:error'))
      }
      return [endpoint, body]
    }))
      .then((results) => {
        setData(Object.fromEntries(results))
      })
      .catch((err) => {
        setError(err.message || t('common:unexpectedError'))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [range, appliedCustomDates, startDate, endDate, t])

  useEffect(() => {
    const timer = setTimeout(loadAnalytics, 0)
    return () => clearTimeout(timer)
  }, [loadAnalytics])

  const handleApplyCustomRange = (e) => {
    e.preventDefault()
    if (!startDate || !endDate) {
      setError(t('chooseStartEndDate'))
      return
    }
    if (new Date(startDate) > new Date(endDate)) {
      setError(t('endDateAfterStartDate'))
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
              <span>{t('operationalIntelligence')}</span>
            </div>
            <h1>{t('analyticsTitle')}</h1>
            <p className="analytics-subtitle">
              {t('analyticsSubtitle')}
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
                title={t('refreshTitle')}
                whileHover={reduceMotion ? undefined : { scale: 1.03 }}
                whileTap={reduceMotion ? undefined : { scale: 0.97 }}
                transition={snappy}
              >
                <RefreshCw size={14} className={loading ? 'analytics-spinning-icon' : ''} />
                <span>{loading ? t('refreshing') : t('refresh')}</span>
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
                  <span>{t('startDate')}</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    required
                  />
                </label>
                <label className="analytics-date-field">
                  <span>{t('endDate')}</span>
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
                  {t('applyCustomRange')}
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
              <span>{t('tryAgain')}</span>
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============================================================
          LOADING SKELETON OR CONTENT
          ============================================================ */}
      {loading && !data.overview ? (
        <AnalyticsLoadingSkeleton t={t} />
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
                    <span className="analytics-kpi-label">{t('recordedRevenue')}</span>
                  </div>
                  {revGrowthPct != null ? (
                    <span className={`analytics-kpi-badge ${revGrowthPct >= 0 ? 'positive' : 'negative'}`}>
                      {revGrowthPct >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
                      <span>{revGrowthPct > 0 ? `+${revGrowthPct}%` : `${revGrowthPct}%`}</span>
                    </span>
                  ) : (
                    <span className="analytics-kpi-badge neutral">
                      <span>{t('baseline')}</span>
                    </span>
                  )}
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {formatMoney(overview.revenue)}
                  </div>
                  <p className="analytics-kpi-note">
                    {overview.revenue_previous_period != null && overview.revenue_previous_period > 0
                      ? t('vsPreviousPeriod', { amount: formatMoney(overview.revenue_previous_period) })
                      : t('totalPaymentRecords')}
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
                    <span className="analytics-kpi-label">{t('activeMembers')}</span>
                  </div>
                  <span className="analytics-kpi-badge positive">
                    <CheckCircle2 size={12} />
                    <span>
                      {overview.total_members > 0
                        ? t('validPct', { pct: Math.round(((overview.active_members || 0) / overview.total_members) * 100) })
                        : t('current')}
                    </span>
                  </span>
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {(overview.active_members || 0).toLocaleString()}
                  </div>
                  <p className="analytics-kpi-note">
                    {t('outOfTotal', { total: (overview.total_members || 0).toLocaleString() })}
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
                    <span className="analytics-kpi-label">{t('newRegistrations')}</span>
                  </div>
                  {memberGrowthPct != null ? (
                    <span className={`analytics-kpi-badge ${memberGrowthPct >= 0 ? 'positive' : 'negative'}`}>
                      {memberGrowthPct >= 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                      <span>{memberGrowthPct > 0 ? `+${memberGrowthPct}%` : `${memberGrowthPct}%`}</span>
                    </span>
                  ) : (
                    <span className="analytics-kpi-badge neutral">
                      <span>{t('joinsCountUnit', { count: overview.member_growth ?? 0 })}</span>
                    </span>
                  )}
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {(overview.new_members || 0).toLocaleString()}
                  </div>
                  <p className="analytics-kpi-note">
                    {overview.new_members_previous_period != null
                      ? t('priorCycleJoins', { count: overview.new_members_previous_period })
                      : t('newJoinsRecorded')}
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
                    <span className="analytics-kpi-label">{t('payingMembers')}</span>
                  </div>
                  <span className="analytics-kpi-badge neutral">
                    <span>{t('transacted')}</span>
                  </span>
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {(financial.paying_members || 0).toLocaleString()}
                  </div>
                  <p className="analytics-kpi-note">
                    {t('avgPerPayingMember', { amount: formatMoney(financial.average_revenue_per_paying_member) })}
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
                    <span className="analytics-kpi-label">{t('expiredTerms')}</span>
                  </div>
                  {(overview.expired_memberships || 0) > 0 ? (
                    <span className="analytics-kpi-badge negative">
                      <span>{t('actionNeeded')}</span>
                    </span>
                  ) : (
                    <span className="analytics-kpi-badge positive">
                      <span>{t('upToDate')}</span>
                    </span>
                  )}
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {(overview.expired_memberships || 0).toLocaleString()}
                  </div>
                  <p className="analytics-kpi-note">
                    {t('expiredRequiringRenewal')}
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
                    <span className="analytics-kpi-label">{t('lifetimeRevenue')}</span>
                  </div>
                  <span className="analytics-kpi-badge neutral">
                    <span>{t('cumulative')}</span>
                  </span>
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {formatMoney(overview.total_recorded_revenue)}
                  </div>
                  <p className="analytics-kpi-note">
                    {t('allTimeVolume')}
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
                    <span className="analytics-kpi-label">{t('totalRoster')}</span>
                  </div>
                  <span className="analytics-kpi-badge neutral">
                    <span>{t('allTime')}</span>
                  </span>
                </div>

                <div className="analytics-kpi-body">
                  <div className="analytics-kpi-value">
                    {(overview.total_members || 0).toLocaleString()}
                  </div>
                  <p className="analytics-kpi-note">
                    {t('cumulativeFacilities')}
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
                  <h2>{t('financialAcquisition')}</h2>
                  <p>{t('financialAcquisitionDesc')}</p>
                </div>
              </div>
            </div>

            <div className="analytics-charts-dual-grid">
              {/* Chart 1: Revenue Line/Area Chart */}
              <article className="analytics-panel-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>{t('revenueTrend')}</h3>
                    <p>{t('collectionsTimeline')}</p>
                  </div>
                  <div className="analytics-panel-stat-pill">
                    {formatMoney(financial.revenue)}
                  </div>
                </div>

                <RevenueTrendChart
                  rows={financial.trend}
                  formatMoney={formatMoney}
                  formatChartLabel={formatChartLabel}
                  t={t}
                />
              </article>

              {/* Chart 2: Member Growth Bar Chart */}
              <article className="analytics-panel-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>{t('newMemberAcquisition')}</h3>
                    <p>{t('registrationsByJoinDate')}</p>
                  </div>
                  <div className="analytics-panel-stat-pill">
                    {t('joinsCount', { count: overview.new_members || 0 })}
                  </div>
                </div>

                <MemberGrowthBarChart
                  rows={growth.new_members}
                  formatChartLabel={formatChartLabel}
                  t={t}
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
                  <h2>{t('retentionHealthTitle')}</h2>
                  <p>{t('retentionHealthDesc')}</p>
                </div>
              </div>
            </div>

            <div className="analytics-charts-dual-grid">
              {/* Retention Health Card */}
              <article className="analytics-panel-card analytics-health-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>{t('membershipLifecycle')}</h3>
                    <p>{t('statusBreakdown')}</p>
                  </div>
                </div>

                <RetentionDistributionWidget retention={retention} t={t} />

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
                    <h3>{t('planPerformance')}</h3>
                    <p>{t('planActiveVolume')}</p>
                  </div>
                  {memberships.most_popular_plan && (
                    <span className="analytics-status-pill success">
                      <Sparkles size={11} />
                      <span>{t('topPlan', { name: memberships.most_popular_plan })}</span>
                    </span>
                  )}
                </div>

                <PlanPerformanceWidget
                  plans={memberships.plans}
                  formatMoney={formatMoney}
                  t={t}
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
                  <h2>{t('branchPerformance')}</h2>
                  <p>{t('branchPerformanceDesc')}</p>
                </div>
              </div>
            </div>

            <div className="analytics-charts-dual-grid">
              <article className="analytics-panel-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>{t('membersByBranch')}</h3>
                    <p>{t('memberDistribution')}</p>
                  </div>
                  <div className="analytics-panel-stat-pill">
                    {t('facilitiesCount', { count: branches.branches?.length || 0 })}
                  </div>
                </div>

                <BranchComparisonWidget
                  branches={branches.branches}
                  t={t}
                />
              </article>

              <article className="analytics-panel-card">
                <div className="analytics-panel-head">
                  <div className="analytics-panel-title-area">
                    <h3>{t('branchRevenue')}</h3>
                    <p>{t('branchRevenueDesc')}</p>
                  </div>
                </div>

                <BranchRevenueWidget
                  branches={branches.branches}
                  formatMoney={formatMoney}
                  t={t}
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
                    <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{t('operationalBreakdown')}</h3>
                    <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>
                      {t('granularMetrics')}
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
                    <span>{t('membershipPlans')}</span>
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
                    <span>{t('branches')}</span>
                  </button>
                </div>
              </div>

              {activeTableTab === 'plans' ? (
                <div className="analytics-table-scroll-wrap">
                  <table className="analytics-modern-table" aria-label="Membership plans detailed table">
                    <thead>
                      <tr>
                        <th>{t('planName')}</th>
                        <th>{t('activeMembers')}</th>
                        <th>{t('expired')}</th>
                        <th>{t('expiringSoonDays')}</th>
                        <th>{t('avgTermDuration')}</th>
                        <th>{t('recordedRevenue')}</th>
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
                                  {t('soonCount', { count: plan.expiring_soon })}
                                </span>
                              ) : (
                                '0'
                              )}
                            </td>
                            <td>
                              {plan.average_recorded_term_days != null
                                ? t('daysCount', { count: plan.average_recorded_term_days })
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
                              <h4>{t('noPlansFound')}</h4>
                              <p>{t('noPlansFoundDesc')}</p>
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
                        <th>{t('facilityBranch')}</th>
                        <th>{t('totalMembers')}</th>
                        <th>{t('activeMembers')}</th>
                        <th>{t('newMembersRange')}</th>
                        <th>{t('recordedRevenue')}</th>
                        <th>{t('status')}</th>
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
                                {t('operational')}
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
                              <h4>{t('noBranchesFound')}</h4>
                              <p>{t('noBranchesFoundDesc')}</p>
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
function RevenueTrendChart({ rows = [], formatMoney, formatChartLabel, t }) {
  const [hoveredPoint, setHoveredPoint] = useState(null)
  const chartGradientId = useId()

  const hasData = rows.length > 0 && rows.some((r) => Number(r.revenue) > 0)

  if (!hasData) {
    return (
      <div className="analytics-empty-state">
        <div className="analytics-empty-icon-wrap">
          <CreditCard size={24} />
        </div>
        <h4>{t('noFinancialData')}</h4>
        <p>{t('noFinancialDataDesc')}</p>
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
function MemberGrowthBarChart({ rows = [], formatChartLabel, t }) {
  const hasData = rows.length > 0 && rows.some((r) => Number(r.count) > 0)

  if (!hasData) {
    return (
      <div className="analytics-empty-state">
        <div className="analytics-empty-icon-wrap">
          <Users size={24} />
        </div>
        <h4>{t('noMemberJoins')}</h4>
        <p>{t('noMemberJoinsDesc')}</p>
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
          <div key={idx} className="analytics-bar-col" title={`${formattedLabel}: ${t('joinsCountUnit', { count })}`}>
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
function RetentionDistributionWidget({ retention = {}, t }) {
  const active = retention.current_active_memberships || 0
  const expired = retention.current_expired_memberships || 0
  const cancelled = retention.explicitly_cancelled_memberships || 0
  const none = retention.members_without_membership_record || 0
  const total = active + expired + cancelled + none

  return (
    <div className="analytics-distribution-bar-wrap">
      <div className="analytics-distribution-labels">
        <span>{t('active')} ({active})</span>
        <span>{t('expired')} ({expired})</span>
        <span>{t('cancelled')} ({cancelled})</span>
        <span>{t('none')} ({none})</span>
      </div>

      <div className="analytics-distribution-bar">
        {total > 0 ? (
          <>
            <div className="analytics-dist-segment active" style={{ width: `${(active / total) * 100}%` }} title={`${t('active')}: ${active}`} />
            <div className="analytics-dist-segment expired" style={{ width: `${(expired / total) * 100}%` }} title={`${t('expired')}: ${expired}`} />
            <div className="analytics-dist-segment cancelled" style={{ width: `${(cancelled / total) * 100}%` }} title={`${t('cancelled')}: ${cancelled}`} />
            <div className="analytics-dist-segment none" style={{ width: `${(none / total) * 100}%` }} title={`${t('none')}: ${none}`} />
          </>
        ) : (
          <div className="analytics-dist-segment none" style={{ width: '100%' }} />
        )}
      </div>

      <div className="analytics-health-tiles-grid" style={{ marginTop: 18 }}>
        <div className="analytics-health-tile active">
          <span className="analytics-health-tile-title">{t('currentlyActive')}</span>
          <span className="analytics-health-tile-val">{active}</span>
        </div>
        <div className="analytics-health-tile expired">
          <span className="analytics-health-tile-title">{t('currentlyExpired')}</span>
          <span className="analytics-health-tile-val">{expired}</span>
        </div>
        <div className="analytics-health-tile cancelled">
          <span className="analytics-health-tile-title">{t('explicitlyCancelled')}</span>
          <span className="analytics-health-tile-val">{cancelled}</span>
        </div>
        <div className="analytics-health-tile none">
          <span className="analytics-health-tile-title">{t('noMembershipRecord')}</span>
          <span className="analytics-health-tile-val">{none}</span>
        </div>
      </div>
    </div>
  )
}

/**
 * Plan Performance Widget
 */
function PlanPerformanceWidget({ plans = [], formatMoney, t }) {
  if (!plans.length) {
    return (
      <div className="analytics-empty-state">
        <div className="analytics-empty-icon-wrap">
          <CreditCard size={24} />
        </div>
        <h4>{t('noPlansConfigured')}</h4>
        <p>{t('noPlansConfiguredDesc')}</p>
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
                {t('activeCount', { count: plan.active || 0 })}
              </span>
            </div>
            <div className="analytics-ranked-track">
              <div className="analytics-ranked-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="analytics-ranked-top analytics-ranked-sub">
              <span>{t('recordedAmount', { amount: formatMoney(plan.recorded_revenue) })}</span>
              <span>{t('expiredAndDueSoon', { expired: plan.expired || 0, soon: plan.expiring_soon || 0 })}</span>
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
function BranchComparisonWidget({ branches = [], t }) {
  if (!branches.length) {
    return (
      <div className="analytics-empty-state">
        <div className="analytics-empty-icon-wrap">
          <Building2 size={24} />
        </div>
        <h4>{t('noBranchesRegistered')}</h4>
        <p>{t('noBranchesRegisteredDesc')}</p>
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
                {t('membersCount', { count: b.total_members || 0 })}
              </span>
            </div>
            <div className="analytics-ranked-track">
              <div className="analytics-ranked-fill" style={{ width: `${pct}%` }} />
            </div>
            <div className="analytics-ranked-top analytics-ranked-sub">
              <span>{t('activeMembersCount', { count: b.active_members || 0 })}</span>
              <span>{t('newInPeriod', { count: b.new_members || 0 })}</span>
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
function BranchRevenueWidget({ branches = [], formatMoney, t }) {
  const hasRevenue = branches.some((b) => Number(b.recorded_revenue) > 0)
  const maxRevenue = Math.max(...branches.map((b) => Number(b.recorded_revenue) || 0), 1)

  if (!hasRevenue) {
    return (
      <div className="analytics-empty-state">
        <div className="analytics-empty-icon-wrap">
          <DollarSign size={24} />
        </div>
        <h4>{t('noBranchRevenue')}</h4>
        <p>{t('noBranchRevenueDesc')}</p>
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
function AnalyticsLoadingSkeleton({ t }) {
  return (
    <div className="analytics-skeleton-wrapper" aria-busy="true" aria-label={t ? t('loadingAnalytics') : 'Loading analytics data'}>
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
