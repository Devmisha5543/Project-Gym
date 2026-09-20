import { useState, useEffect } from 'react'
import { API_URL } from './config'
import MembershipList from './MembershipList'
import MembershipForm from './MembershipForm'
import { CreditCard, Receipt } from 'lucide-react'

function MembershipPage() {
  const [memberships, setMemberships] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadMemberships() {
    setLoading(true)
    setPageError('')

    fetch(`${API_URL}/memberships`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Memberships request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setMemberships(data))
      .catch(error => {
        console.error('Failed to load memberships:', error)
        setMemberships([])
        setPageError('Unable to load memberships. Please try again.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadMemberships, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container memberships-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">GYM MANAGEMENT</p>
          <h1>Memberships</h1>
          <p className="page-description">
            Track member plans, dates, and membership status in one place.
          </p>
        </div>

        <div className="membership-total">
          <CreditCard size={19} />
          <span>{memberships.length}</span>
          <small>Total Memberships</small>
        </div>
      </div>

      <MembershipForm onMembershipCreated={loadMemberships} />

      {pageError && (
        <div className="membership-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (
        <div className="membership-state">
          <div className="loading-spinner"></div>
          <h3>Loading memberships</h3>
          <p>Getting membership information ready.</p>
        </div>
      ) : (
        <MembershipList memberships={memberships} />
      )}
    </div>
  )
}

export default MembershipPage
