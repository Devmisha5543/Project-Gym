import { useState, useEffect } from 'react'
import { API_URL } from './config'
import { useGym } from './GymContext'
import MemberDetail from './MemberDetail'
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
  const { gym, loading: gymLoading } = useGym()
  const [expiring, setExpiring] = useState([])
  const [memberCount, setMemberCount] = useState(0)
  const [classCount, setClassCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)
  const [loading, setLoading] = useState(true)
  const [selectedMembership, setSelectedMembership] = useState(null)
  const [branches, setBranches] = useState([])

  function loadDashboard() {
    setLoading(true)

    Promise.all([
      fetch(`${API_URL}/members`).then(response => response.json()),
      fetch(`${API_URL}/classes`).then(response => response.json()),
      fetch(`${API_URL}/payments`).then(response => response.json()),
      fetch(`${API_URL}/memberships/expiring`).then(response => response.json()),
      fetch(`${API_URL}/branches`).then(response => response.json()),
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
      })
      .finally(() => {
        setLoading(false)
      })
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadDashboard, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="dashboard">

      {/* HEADER */}
      <section className="dashboard-header">

        <div>
          <p className="dashboard-eyebrow">
            OVERVIEW
          </p>

          <h1>
            Overview of your gym's activity and performance.
          </h1>

          <p className="dashboard-subtitle">
            Gym operations at a glance.
          </p>
        </div>

        <button
          className="refresh-button"
          onClick={loadDashboard}
          disabled={loading}
        >
          <RefreshCw size={15} className={loading ? 'refresh-icon-spinning' : ''} />
          {loading ? 'Refreshing...' : 'Refresh data'}
        </button>

      </section>


      {/* STATISTICS */}
      <section className="dashboard-stats">

        <div className="dashboard-stat-card">
          <div className="stat-top">
            <span className="stat-title">
              Active Members
            </span>

            <span className="stat-icon">
              <Users size={16} />
            </span>
          </div>

          <div className="stat-number">
            {loading ? '—' : memberCount}
          </div>

          <p className="stat-description">
            Registered gym members
          </p>
        </div>


        <div className="dashboard-stat-card">
          <div className="stat-top">
            <span className="stat-title">
              Scheduled Classes
            </span>

            <span className="stat-icon">
              <CalendarDays size={16} />
            </span>
          </div>

          <div className="stat-number">
            {loading ? '—' : classCount}
          </div>

          <p className="stat-description">
            Classes currently scheduled
          </p>
        </div>


        <div className="dashboard-stat-card revenue-card">
          <div className="stat-top">
            <span className="stat-title">
              Total Revenue
            </span>

            <span className="stat-icon">
              <CreditCard size={16} />
            </span>
          </div>

          <div className="stat-number">
            {loading
              ? '—'
              : new Intl.NumberFormat('en-US', {
                  style: 'currency',
                  currency: gym?.currency || 'ETB',
                }).format(totalRevenue)
            }
         </div>

          <p className="stat-description">
            Total recorded payments
          </p>
        </div>

      </section>


      {/* QUICK ACTIONS */}
      <section className="dashboard-section">

        <div className="section-heading">
          <div>
            <p className="dashboard-eyebrow">
              SHORTCUTS
            </p>

            <h2>
              Quick Actions
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
              <strong>Add Member</strong>
              <span>Register a new member</span>
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
              <strong>Record Payment</strong>
              <span>Add a new payment</span>
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
              <strong>Manage Classes</strong>
              <span>View and manage classes</span>
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
              <strong>Equipment</strong>
              <span>Manage gym equipment</span>
            </div>
          </a>

        </div>

      </section>


      {/* EXPIRING MEMBERSHIPS */}
      <section className="dashboard-section">

        <div className="section-heading">

          <div>
            <p className="dashboard-eyebrow">
              <Activity size={13} /> ATTENTION NEEDED
            </p>

            <h2>
              Memberships Expiring Soon
            </h2>

            <p className="section-description">
              Members whose memberships expire within the next 7 days.
            </p>
          </div>

          <a
            href="/memberships"
            className="view-all"
          >
            View memberships →
          </a>

        </div>


        <div className="expiring-container">

          {loading ? (

            <div className="dashboard-empty">
              <div className="loading-dot"></div>

              <p>
                Loading membership information...
              </p>
            </div>

          ) : expiring.length === 0 ? (

            <div className="dashboard-empty">

              <div className="empty-symbol">
                <CheckCircle2 size={19} />
              </div>

              <h3>
                You're all caught up
              </h3>

              <p>
                No memberships are expiring within the next 7 days.
              </p>

            </div>

          ) : (

            <div className="expiring-list">

              {expiring.map(membership => (

                <div
                  className="expiring-member"
                  key={membership.membership_id}
                >

                  <div className="member-avatar">
                    {membership.member_name
                      ? membership.member_name
                          .charAt(0)
                          .toUpperCase()
                      : '?'}
                  </div>


                  <div className="member-details">

                    <strong>
                      {membership.member_name}
                    </strong>

                    <span>
                      {membership.member_phone || 'No phone number'}
                    </span>

                  </div>


                  <div className="expiry-date">

                    <span className="expiry-label">
                      Expires
                    </span>

                    <strong>
                      {membership.end_date}
                    </strong>

                  </div>

                  <span className="expiry-status">
                    <span className="expiry-status-dot"></span>
                    Due soon
                  </span>


                  <button
                    type="button"
                    className="member-action"
                    onClick={() => setSelectedMembership(membership)}
                  >
                    View <ArrowUpRight size={14} />
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
              onClose={() => setSelectedMembership(null)}
            />
          </div>
        </div>
      )}

    </div>
  )
}

export default DashboardPage