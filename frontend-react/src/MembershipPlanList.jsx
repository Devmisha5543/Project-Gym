import { CreditCard, DollarSign, Sparkles } from 'lucide-react'

function MembershipPlanList({ membershipPlans }) {
  if (membershipPlans.length === 0) {
    return (
      <div className="plan-state plan-empty-state">
        <div className="plan-state-icon">
          <CreditCard size={25} />
        </div>
        <h3>No membership plans yet</h3>
        <p>Create your first plan above to start building the catalogue.</p>
      </div>
    )
  }

  return (
    <div className="plan-list">
      {membershipPlans.map(plan => (
        <article className="plan-card" key={plan.plan_id}>
          <div className="plan-card-topline">
            <div className="plan-card-icon">
              <CreditCard size={20} />
            </div>
            <span className="plan-card-label">Plan #{plan.plan_id}</span>
          </div>

          <h2>{plan.plan_name}</h2>

          <div className="plan-price">
            <DollarSign size={19} />
            <strong>{Number(plan.price || 0).toFixed(2)}</strong>
          </div>

          <div className="plan-perks">
            <Sparkles size={15} />
            <span>{plan.perks || 'Benefits not provided'}</span>
          </div>

        </article>
      ))}
    </div>
  )
}

export default MembershipPlanList
