import { useState, useEffect } from 'react'
import { paymentSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import {
  CalendarDays,
  CreditCard,
  DollarSign,
  FileText,
  Plus,
  Save
} from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function PaymentForm({ onPaymentCreated }) {
  const [memberships, setMemberships] = useState([])
  const [membershipId, setMembershipId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [errors, setErrors] = useState({})
  const [successMessage, setSuccessMessage] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [loadingMemberships, setLoadingMemberships] = useState(true)

  useEffect(() => {
    authFetch(`${API_URL}/memberships`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to load memberships')
        }

        return response.json()
      })
      .then(data => {
        setMemberships(Array.isArray(data) ? data : [])
      })
      .catch(error => {
        console.error('Failed to load memberships:', error)
        setMemberships([])
        setLookupError('Unable to load memberships. Please try again.')
      })
      .finally(() => {
        setLoadingMemberships(false)
      })
  }, [])

  function handleMembershipChange(event) {
    const selectedMembershipId = event.target.value

    setMembershipId(selectedMembershipId)

    const selectedMembership = memberships.find(
      membership =>
        String(membership.membership_id) === selectedMembershipId
    )

    if (selectedMembership) {
      setAmount(selectedMembership.price)
    } else {
      setAmount('')
    }

    setErrors(prev => ({
      ...prev,
      membershipId: undefined,
      amount: undefined
    }))
  }

  function handleSubmit(event) {
    event.preventDefault()

    const result = paymentSchema.safeParse({
      membershipId,
      amount,
      paymentDate
    })

    if (!result.success) {
      const fieldErrors = {}

      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })

      setErrors(fieldErrors)

      return
    }

    setErrors({})
    setSuccessMessage('')
    setSubmitting(true)

    const newPayment = {
      membership_id: membershipId,
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod
    }

    authFetch(`${API_URL}/payments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newPayment)
    })
      .then(async response => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(
            data.error || 'Failed to record payment'
          )
        }

        return data
      })
      .then(() => {
        setMembershipId('')
        setAmount('')
        setPaymentDate('')
        setPaymentMethod('')
        setErrors({})

        onPaymentCreated()
        setSuccessMessage('Payment recorded successfully.')
      })
      .catch(error => {
        console.error('Failed to record payment:', error)

        setErrors({
          general:
          error.message ||
          'Unable to record payment. Please try again.'
        })
      })
      .finally(() => setSubmitting(false))
  }

  return (
    <section className="payment-form-section">

      <div className="payment-form-heading">

        <div className="payment-form-icon">
          <Plus size={19} />
        </div>

        <div>
          <h2>Record Payment</h2>

          <p>
            Add a payment to an existing membership.
          </p>
        </div>

      </div>

      <form
        className="payment-form"
        onSubmit={handleSubmit}
      >

        {errors.general && (
          <div className="form-error">
            {errors.general}
          </div>
        )}

        <FeedbackMessage message={successMessage} type="success" />
        <FeedbackMessage message={lookupError} />

        <div className="payment-form-grid">

          {/* Membership */}
          <label className="payment-field payment-field-wide">

            <span>Member & Membership Plan</span>

            <div className="payment-input-wrap">

              <CreditCard size={16} />

              <select
                value={membershipId}
                onChange={handleMembershipChange}
                required
              >

                <option value="">
                  Select a member
                </option>

                {memberships
                  .filter(
                    membership =>
                      membership.status === 'active'
                  )
                  .map(membership => (

                    <option
                      key={membership.membership_id}
                      value={membership.membership_id}
                    >
                      {membership.member_name} —{' '}
                      {membership.plan_name}
                    </option>

                  ))}

              </select>

            </div>

            {errors.membershipId && (
              <small className="payment-field-error">
                {errors.membershipId}
              </small>
            )}

          </label>

          {/* Amount */}
          <label className="payment-field">

            <span>Amount</span>

            <div className="payment-input-wrap">

              <DollarSign size={16} />

              <input
                type="number"
                step="0.01"
                min="0"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                placeholder="0.00"
              />

            </div>

            {errors.amount && (
              <small className="payment-field-error">
                {errors.amount}
              </small>
            )}

          </label>

          {/* Payment Date */}
          <label className="payment-field">

            <span>Payment date</span>

            <div className="payment-input-wrap">

              <CalendarDays size={16} />

              <input
                type="datetime-local"
                value={paymentDate}
                onChange={e =>
                  setPaymentDate(e.target.value)
                }
                required
              />

            </div>

            {errors.paymentDate && (
              <small className="payment-field-error">
                {errors.paymentDate}
              </small>
            )}

          </label>

          {/* Payment Method */}
          <label className="payment-field">

            <span>Payment method</span>

            <div className="payment-input-wrap">

              <FileText size={16} />

              <input
                type="text"
                value={paymentMethod}
                onChange={e =>
                  setPaymentMethod(e.target.value)
                }
                required
                placeholder="e.g. Cash or card"
              />

            </div>

          </label>

        </div>

        <div className="payment-form-actions">

          <button
            type="submit"
            className="payment-primary-button"
            disabled={submitting || loadingMemberships}
          >
            <Save size={16} />
            {submitting ? 'Recording...' : loadingMemberships ? 'Loading memberships...' : 'Add Payment'}
          </button>

        </div>

      </form>

    </section>
  )
}

export default PaymentForm
