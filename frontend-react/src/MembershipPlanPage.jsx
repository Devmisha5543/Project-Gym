import { authFetch } from './authFetch'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import MembershipPlanList from './MembershipPlanList'
import MembershipPlanForm from './MembershipPlanForm'
import { CreditCard, Receipt } from 'lucide-react'

function MembershipPlanPage() {
  const { t } = useTranslation(['payments', 'common'])
  const [membershipPlans, setMembershipPlans] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadMembershipPlans = useCallback(() => {
    setLoading(true)
    setPageError('')

    authFetch(`${API_URL}/membershipplans`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Membership plans request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setMembershipPlans(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load membership plans:', error)
        setMembershipPlans([])
        setPageError(t('planLoadFailed'))
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadMembershipPlans, 0)
    return () => clearTimeout(loadTimer)
  }, [loadMembershipPlans])

  return (
    <div className="page-container membership-plans-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{t('eyebrow')}</p>
          <h1>{t('plansTitle')}</h1>
          <p className="page-description">
            {t('plansDescription')}
          </p>
        </div>

        <div className="plan-total">
          <CreditCard size={19} />
          <span>{membershipPlans.length}</span>
          <small>{t('totalPlans')}</small>
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
          <h3>{t('loadingPlans')}</h3>
          <p>{t('gettingPlansReady')}</p>
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
