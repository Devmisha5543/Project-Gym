import { CalendarDays, CreditCard, UserRound } from 'lucide-react'

function MembershipList({ memberships }) {
  if (memberships.length === 0) {
    return (
      <div className="membership-state membership-empty-state">
        <div className="membership-state-icon">
          <CreditCard size={25} />
        </div>
        <h3>No memberships yet</h3>
        <p>Create a membership above to start tracking plans and expiration dates.</p>
      </div>
    )
  }

  return (
    <div className="membership-list">
      {memberships.map(membership => (
        <article className="membership-card" key={membership.membership_id}>
          <div className="membership-card-icon">
            <CreditCard size={20} />
          </div>

          <div className="membership-card-main">
            <div className="membership-card-title-row">
              <div>
                <span className="membership-card-label">Membership #{membership.membership_id}</span>
                <h2>Member {membership.member_id}</h2>
              </div>
              <span className={`membership-status membership-status-${String(membership.status || 'unknown').toLowerCase()}`}>
                {membership.status || 'Status unavailable'}
              </span>
            </div>

            <div className="membership-card-meta">
              <span><UserRound size={15} />Member #{membership.member_id}</span>
              <span><CreditCard size={15} />Plan #{membership.plan_id}</span>
            </div>

            <div className="membership-card-dates">
              <div>
                <span>Starts</span>
                <strong><CalendarDays size={14} />{membership.start_date}</strong>
              </div>
              <div>
                <span>Expires</span>
                <strong><CalendarDays size={14} />{membership.end_date}</strong>
              </div>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default MembershipList
