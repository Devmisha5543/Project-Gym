import { API_URL } from './config'
function MembershipPlanList({ membershipPlans }) {
  return (
    <ul>
      {membershipPlans.map(plan => (
        <li key={plan.plan_id}>
          {plan.plan_name} - ${plan.price}
        </li>
      ))}
    </ul>
  )
}

export default MembershipPlanList
