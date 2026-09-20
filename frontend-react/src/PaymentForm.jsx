import { useState, useEffect } from 'react'
import { paymentSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { CalendarDays, CreditCard, DollarSign, FileText, Plus, Save } from 'lucide-react'

function PaymentForm({ onPaymentCreated }) {
  const [memberships, setMemberships] = useState([])
  const [membershipId, setMembershipId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetch(`${API_URL}/memberships`)
      .then(response => response.json())
      .then(data => setMemberships(data))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const result = paymentSchema.safeParse({ membershipId, amount, paymentDate })
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const newPayment = {
      membership_id: membershipId,
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod
    }

    authFetch(`${API_URL}/payments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPayment)
    })
      .then(response => response.json())
      .then(() => {
        setMembershipId('')
        setAmount('')
        setPaymentDate('')
        setPaymentMethod('')
        onPaymentCreated()
      })
  }

  return (
    <section className="payment-form-section">
      <div className="payment-form-heading">
        <div className="payment-form-icon">
          <Plus size={19} />
        </div>
        <div>
          <h2>Record Payment</h2>
          <p>Add a payment to an existing membership.</p>
        </div>
      </div>

      <form className="payment-form" onSubmit={handleSubmit}>
        <div className="payment-form-grid">
          <label className="payment-field payment-field-wide">
            <span>Membership</span>
            <div className="payment-input-wrap">
              <CreditCard size={16} />
              <select value={membershipId} onChange={e => setMembershipId(e.target.value)} required>
                <option value="">Select a membership</option>
                {memberships.map(membership => (
                  <option key={membership.membership_id} value={membership.membership_id}>
                    Membership #{membership.membership_id} (Member {membership.member_id})
                  </option>
                ))}
              </select>
            </div>
            {errors.membershipId && <small className="payment-field-error">{errors.membershipId}</small>}
          </label>

          <label className="payment-field">
            <span>Amount</span>
            <div className="payment-input-wrap">
              <DollarSign size={16} />
              <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
            </div>
            {errors.amount && <small className="payment-field-error">{errors.amount}</small>}
          </label>

          <label className="payment-field">
            <span>Payment date</span>
            <div className="payment-input-wrap">
              <CalendarDays size={16} />
              <input type="datetime-local" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
            </div>
            {errors.paymentDate && <small className="payment-field-error">{errors.paymentDate}</small>}
          </label>

          <label className="payment-field">
            <span>Payment method</span>
            <div className="payment-input-wrap">
              <FileText size={16} />
              <input type="text" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required placeholder="e.g. Cash or card" />
            </div>
          </label>
        </div>

        <div className="payment-form-actions">
          <button type="submit" className="payment-primary-button">
            <Save size={16} /> Add Payment
          </button>
        </div>
      </form>
    </section>
  )
}

export default PaymentForm
