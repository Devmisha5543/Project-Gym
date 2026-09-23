import { useState, useEffect } from 'react'
import { API_URL } from './config'
import MembershipPlanList from './MembershipPlanList'
import MembershipPlanForm from './MembershipPlanForm'
import { CreditCard, Receipt } from 'lucide-react'

function MembershipPlanPage() {
  const [membershipPlans, setMembershipPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadMembershipPlans() {
    setLoading(true)
    setPageError('')

    fetch(`${API_URL}/membershipplans`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Membership plans request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setMembershipPlans(data))
      .catch(error => {
        console.error('Failed to load membership plans:', error)
        setMembershipPlans([])
        setPageError('Unable to load membership plans. Please try again.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadMembershipPlans, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container membership-plans-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">GYM MANAGEMENT</p>
          <h1>Membership Plans</h1>
          <p className="page-description">
            Define the plans and benefits available to your members.
          </p>
        </div>

        <div className="plan-total">
          <CreditCard size={19} />
          <span>{membershipPlans.length}</span>
          <small>Total Plans</small>
        </div>
      </div>

      <MembershipPlanForm onMembershipPlanCreated={loadMembershipPlans} />

      {pageError && (
        <div className="plan-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (
        <div className="plan-state">
          <div className="loading-spinner"></div>
          <h3>Loading membership plans</h3>
          <p>Getting your plan catalogue ready.</p>
        </div>
      ) : (
        <MembershipPlanList 
          membershipPlans={membershipPlans}
          onPlanUpdated={loadMembershipPlans}
          onPlanDeleted={loadMembershipPlans}
        />
      )}
    </div>
  )
}

export default MembershipPlanPage
