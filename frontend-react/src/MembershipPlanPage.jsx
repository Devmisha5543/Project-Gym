import { useState, useEffect } from 'react'
import { API_URL } from './config'
import MembershipPlanList from './MembershipPlanList'
import MembershipPlanForm from './MembershipPlanForm'

function MembershipPlanPage() {
  const [membershipPlans, setMembershipPlans] = useState([])

  function loadMembershipPlans() {
    fetch(`${API_URL}/membershipplans`)
      .then(response => response.json())
      .then(data => setMembershipPlans(data))
  }

  useEffect(() => {
    loadMembershipPlans()
  }, [])

  return (
    <div>
      <h1>Membership Plans</h1>
      <MembershipPlanForm onMembershipPlanCreated={loadMembershipPlans} />
      <MembershipPlanList membershipPlans={membershipPlans} />
    </div>
  )
}

export default MembershipPlanPage
