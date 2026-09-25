import { useEffect, useState } from 'react'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import {
  CreditCard,
  ChevronDown
} from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function MembershipForm({ onMembershipCreated }) {
  const [members, setMembers] = useState([])
  const [plans, setPlans] = useState([])

  const [memberId, setMemberId] = useState('')
  const [planId, setPlanId] = useState('')
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('active')

  const [loadingData, setLoadingData] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [open, setOpen] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')

  useEffect(() => {
    Promise.all([
      authFetch(`${API_URL}/members`).then(async response => {
        if (!response.ok) {
          throw new Error('Failed to load members')
        }

        return response.json()
      }),

      authFetch(`${API_URL}/membershipplans`).then(async response => {
        if (!response.ok) {
          throw new Error('Failed to load membership plans')
        }

        return response.json()
      })
    ])
      .then(([memberData, planData]) => {
        setMembers(Array.isArray(memberData) ? memberData : [])
        setPlans(Array.isArray(planData) ? planData : [])
      })
      .catch(error => {
        console.error('Failed to load membership form data:', error)
        setError('Unable to load members or membership plans.')
      })
      .finally(() => {
        setLoadingData(false)
      })
  }, [])

  function resetForm() {
    setMemberId('')
    setPlanId('')
    setStartDate(new Date().toISOString().split('T')[0])
    setEndDate('')
    setStatus('active')
    setError('')
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!memberId || !planId || !startDate || !endDate) {
      setError('Please complete all required fields.')
      return
    }

    setSubmitting(true)
    setError('')
    setSuccessMessage('')

    authFetch(`${API_URL}/memberships`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        member_id: Number(memberId),
        plan_id: Number(planId),
        start_date: startDate,
        end_date: endDate,
        status
      })
    })
      .then(async response => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to create membership'
          )
        }

        return data
      })
      .then(() => {
        resetForm()
        setOpen(false)
        onMembershipCreated()
        setSuccessMessage('Membership created successfully.')
      })
      .catch(error => {
        console.error('Failed to create membership:', error)

        setError(
          error.message || 'Unable to create membership.'
        )
      })
      .finally(() => {
        setSubmitting(false)
      })
  }

  return (
    <div className="membership-form-section">

      <button
        className="add-member-header"
        type="button"
        onClick={() => setOpen(!open)}
      >
        <div className="add-member-title">

          <div className="add-member-icon">
            <CreditCard size={21} />
          </div>

          <div>
            <strong>Add Membership</strong>

            <span>
              Assign a membership plan to a member
            </span>
          </div>

        </div>

        <ChevronDown
          size={22}
          className={open ? 'rotate-icon' : ''}
        />
      </button>

      {open && (
        <form
          className="member-form"
          onSubmit={handleSubmit}
        >

          {error && (
            <div className="form-error">
              {error}
            </div>
          )}

          {loadingData ? (
            <div className="membership-state">
              <div className="loading-spinner"></div>

              <p>
                Loading members and membership plans...
              </p>
            </div>
          ) : (
            <div className="form-grid">

              <div className="form-field">
                <label>Member</label>

                <select
                  value={memberId}
                  onChange={e => setMemberId(e.target.value)}
                  required
                >
                  <option value="">
                    Select a member
                  </option>

                  {members.map(member => (
                    <option
                      key={member.member_id}
                      value={member.member_id}
                    >
                      {member.name} — {member.phone}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Membership Plan</label>

                <select
                  value={planId}
                  onChange={e => setPlanId(e.target.value)}
                  required
                >
                  <option value="">
                    Select a membership plan
                  </option>

                  {plans.map(plan => (
                    <option
                      key={plan.plan_id}
                      value={plan.plan_id}
                    >
                      {plan.plan_name} — {plan.price}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Start Date</label>

                <input
                  type="date"
                  value={startDate}
                  onChange={e => setStartDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>End Date</label>

                <input
                  type="date"
                  value={endDate}
                  min={startDate}
                  onChange={e => setEndDate(e.target.value)}
                  required
                />
              </div>

              <div className="form-field">
                <label>Status</label>

                <select
                  value={status}
                  onChange={e => setStatus(e.target.value)}
                >
                  <option value="active">
                    Active
                  </option>

                  <option value="expired">
                    Expired
                  </option>
                </select>
              </div>

            </div>
          )}

          <div className="form-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={() => {
                resetForm()
                setOpen(false)
              }}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="primary-button"
              disabled={submitting || loadingData}
            >
              {submitting
                ? 'Creating Membership...'
                : 'Create Membership'}
            </button>

          </div>

        </form>
      )}

      <FeedbackMessage message={successMessage} type="success" />

    </div>
  )
}

export default MembershipForm
