import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import FeedbackMessage from './FeedbackMessage'
import { authFetch } from './authFetch'
import { useGym } from './GymContext'
import MemberDetail from './MemberDetail'
import MemberPhoto from './MemberPhoto'
import {
  Activity,
  ArrowUpRight,
  CalendarDays,
  CheckCircle2,
  CreditCard,
  Dumbbell,
  RefreshCw,
  Users,
  Wrench
} from 'lucide-react'

function DashboardPage() {
  const { t, i18n } = useTranslation(['analytics', 'common'])
  const navigate = useNavigate()
  const { gym } = useGym()
  const [expiring, setExpiring] = useState([])
  const [memberCount, setMemberCount] = useState(0)
  const [classCount, setClassCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [selectedMembership, setSelectedMembership] = useState(null)
  const [branches, setBranches] = useState([])

  const loadDashboard = useCallback(() => {
    setLoading(true)
    setLoadError('')

    Promise.all([
      authFetch(`${API_URL}/members`).then(response => response.json()),
      authFetch(`${API_URL}/classes`).then(response => response.json()),
      authFetch(`${API_URL}/payments`).then(response => response.json()),
      authFetch(`${API_URL}/memberships/expiring`).then(response => response.json()),
      authFetch(`${API_URL}/branches`).then(response => response.json()),
    ])
      .then(([members, classes, payments, expiringMemberships, branchData]) => {
        setMemberCount(Array.isArray(members) ? members.length : 0)
        setClassCount(Array.isArray(classes) ? classes.length : 0)

        if (Array.isArray(payments)) {
          const total = payments.reduce(
            (sum, payment) => sum + Number(payment.amount || 0),
            0
          )

          setTotalRevenue(total)
        }

        setExpiring(
          Array.isArray(expiringMemberships)
            ? expiringMemberships
            : []
        )
        setBranches(Array.isArray(branchData) ? branchData : [])
      })
      .catch(error => {
        console.error('Dashboard loading error:', error)
        setLoadError(t('unexpectedError', { ns: 'common' }))
      })
      .finally(() => {
        setLoading(false)
      })
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadDashboard, 0)
    return () => clearTimeout(loadTimer)
  }, [loadDashboard])

  function getExpiryStatus(endDate) {
    if (!endDate) return { label: t('dateUnavailable'), className: '' }

    const [year, month, day] = endDate.split('-').map(Number)
    const today = new Date()
    const daysRemaining = Math.ceil((
      Date.UTC(year, month - 1, day) -
      Date.UTC(today.getFullYear(), today.getMonth(), today.getDate())
    ) / 86400000)

    if (daysRemaining < 0) return { label: t('membershipExpired'), className: 'expiry-status-expired' }
    if (daysRemaining <= 3) return { label: t('dueSoon'), className: 'expiry-status-soon' }
    return { label: t('oneWeekLeft'), className: 'expiry-status-week' }
  }

  return (
    <div className="dashboard">

      {/* HEADER */}
      <section className="dashboard-header">

        <div>
          <p className="dashboard-eyebrow">
            {t('overview')}
          </p>

          <h1>
            {t('dashboardSubtitle')}
          </h1>

          <p className="dashboard-subtitle">
            {t('dashboardGlance')}
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'refresh-icon-spinning' : ''} />
          {loading ? t('refreshing') : t('refreshData')}
        </button>

      </section>

      <FeedbackMessage message={loadError} />


      {/* STATISTICS */}
      <section className="dashboard-stats">

        <div className="dashboard-stat-card">
          <div className="stat-top">
            <span className="stat-title">
              {t('activeMembers')}
            </span>

            <span className="stat-icon">
              <Users size={16} />
            </span>
          </div>

          <div className="stat-number">
            {loading ? '—' : memberCount}
          </div>

          <p className="stat-description">
            {t('registeredMembers')}
          </p>
        </div>


        <div className="dashboard-stat-card">
          <div className="stat-top">
            <span className="stat-title">
              {t('scheduledClasses')}
            </span>

            <span className="stat-icon">
              <CalendarDays size={16} />
            </span>
          </div>

          <div className="stat-number">
            {loading ? '—' : classCount}
          </div>

          <p className="stat-description">
            {t('classesCurrentlyScheduled')}
          </p>
        </div>


        <div className="dashboard-stat-card revenue-card">
          <div className="stat-top">
            <span className="stat-title">
              {t('totalRevenue')}
            </span>

            <span className="stat-icon">
              <CreditCard size={16} />
            </span>
          </div>

          <div className="stat-number">
            {loading
              ? '—'
              : new Intl.NumberFormat(i18n.language === 'am' ? 'am-ET' : 'en-US', {
                  style: 'currency',
                  currency: gym?.currency || 'ETB',
                }).format(totalRevenue)
            }
         </div>

          <p className="stat-description">
            {t('totalRecordedPayments')}
          </p>
        </div>

      </section>


      {/* QUICK ACTIONS */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="dashboard-eyebrow">
              {t('shortcuts')}
            </p>

            <h2>
              {t('quickActions')}
            </h2>
          </div>
        </div>


        <div className="quick-actions">

          <a
            href="/members"
            className="quick-action"
          >
            <span className="quick-action-symbol">
              <Users size={17} />
            </span>

            <div>
              <strong>{t('addMember')}</strong>
              <span>{t('registerNewMember')}</span>
            </div>
          </a>


          <a
            href="/payments"
            className="quick-action"
          >
            <span className="quick-action-symbol">
              <CreditCard size={17} />
            </span>

            <div>
              <strong>{t('recordPayment')}</strong>
              <span>{t('addNewPayment')}</span>
            </div>
          </a>


          <a
            href="/classes"
            className="quick-action"
          >
            <span className="quick-action-symbol">
              <Dumbbell size={17} />
            </span>

            <div>
              <strong>{t('manageClasses')}</strong>
              <span>{t('viewManageClasses')}</span>
            </div>
          </a>


          <a
            href="/equipment"
            className="quick-action"
          >
            <span className="quick-action-symbol">
              <Wrench size={17} />
            </span>

            <div>
              <strong>{t('equipment')}</strong>
              <span>{t('manageGymEquipment')}</span>
            </div>
          </a>

        </div>

      </section>


      {/* EXPIRING MEMBERSHIPS */}
      <section className="dashboard-section">

        <div className="section-heading">

          <div>
            <p className="dashboard-eyebrow">
              <Activity size={13} /> {t('attentionNeeded')}
            </p>

            <h2>
              {t('expiringSoonTitle')}
            </h2>

            <p className="section-description">
              {t('expiringSoonDescription')}
            </p>
          </div>

          <a
            href="/members"
            className="view-all"
          >
            {t('viewMembers')}
          </a>

        </div>


        <div className="expiring-container">

          {loading ? (

            <div className="dashboard-empty">
              <div className="loading-dot"></div>

              <p>
                {t('loadingMemberships')}
              </p>
            </div>

          ) : expiring.length === 0 ? (

            <div className="dashboard-empty">

              <div className="empty-symbol">
                <CheckCircle2 size={19} />
              </div>

              <h3>
                {t('allCaughtUp')}
              </h3>

              <p>
                {t('noExpiringMemberships')}
              </p>

            </div>

          ) : (

            <div className="expiring-list">

              {expiring.map(membership => (

                <div
                  className="expiring-member"
                  key={membership.member_id}
                >

                  <button
                    type="button"
                    className="member-avatar expiring-avatar"
                    onClick={() => setSelectedMembership(membership)}
                    aria-label={`View ${membership.member_name}'s details`}
                  >
                    <MemberPhoto
                      key={membership.photo_filename || `member-${membership.member_id}`}
                      member={{ ...membership, name: membership.member_name }}
                      photoUrl={getMemberPhotoUrl(membership.photo_filename)}
                      alt={membership.member_name}
                    />
                  </button>


                  <div className="member-details">

                    <strong>
                      {membership.member_name}
                    </strong>

                    <span>
                      {membership.member_phone || t('noPhoneNumber')}
                    </span>

                  </div>


                  <div className="expiry-date">

                    <span className="expiry-label">
                      {membership.status === 'no_membership'
                        ? t('membership')
                        : t('expires')}
                    </span>

                    <strong>
                      {membership.status === 'no_membership'
                        ? t('none')
                        : membership.end_date}
                    </strong>

                  </div>


                  <span className={`expiry-status ${getExpiryStatus(membership.end_date).className}`}>
                    <span className="expiry-status-dot"></span>
                    {getExpiryStatus(membership.end_date).label}
                  </span>


                  <button
                    type="button"
                    className="member-action"
                    onClick={() => setSelectedMembership(membership)}
                  >
                    {t('view')} <ArrowUpRight size={14} />
                  </button>

                </div>

              ))}

            </div>

          )}

        </div>

      </section>

      {selectedMembership && (
        <div
          className="member-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedMembership.name || selectedMembership.member_name} details`}
          onClick={event => {
            if (event.target === event.currentTarget) setSelectedMembership(null)
          }}
        >
          <div className="member-detail-modal-panel">
            <MemberDetail
              member={selectedMembership}
              branches={branches}
              membership={selectedMembership}
              onMemberUpdated={updatedMember => setSelectedMembership(current => ({ ...current, ...updatedMember }))}
              onMemberDeleted={() => setSelectedMembership(null)}
              onRenew={() => navigate('/payments', { state: { renewalMembershipId: selectedMembership.membership_id } })}
              onClose={() => setSelectedMembership(null)}
            />
          </div>
        </div>
      )}

    </div>
  )
}

function getMemberPhotoUrl(photo) {
  if (!photo) return null
  if (/^(https?:|data:|blob:)/i.test(photo)) return photo
  if (photo.startsWith('/')) return `${API_URL}${photo}`
  return `${API_URL}/uploads/${encodeURIComponent(photo)}`
}

export default DashboardPage
