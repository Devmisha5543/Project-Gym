import { useState, useEffect } from 'react'
import { API_URL } from './config'

function PaymentForm({ onPaymentCreated }) {
  const [memberships, setMemberships] = useState([])
  const [membershipId, setMembershipId] = useState('')
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState('')
  const [paymentMethod, setPaymentMethod] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/memberships`)
      .then(response => response.json())
      .then(data => setMemberships(data))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const newPayment = {
      membership_id: membershipId,
      amount,
      payment_date: paymentDate,
      payment_method: paymentMethod
    }

    fetch(`${API_URL}/payments`, {
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
    <form onSubmit={handleSubmit}>
      <label>Membership:</label>
      <select value={membershipId} onChange={e => setMembershipId(e.target.value)} required>
        <option value="">-- Select a membership --</option>
        {memberships.map(membership => (
          <option key={membership.membership_id} value={membership.membership_id}>
            Membership #{membership.membership_id} (Member {membership.member_id})
          </option>
        ))}
      </select>
      <br /><br />

      <label>Amount:</label>
      <input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required />
      <br /><br />

      <label>Payment Date:</label>
      <input type="datetime-local" value={paymentDate} onChange={e => setPaymentDate(e.target.value)} required />
      <br /><br />

      <label>Method:</label>
      <input type="text" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)} required />
      <br /><br />

      <button type="submit">Add payment</button>
    </form>
  )
}

export default PaymentForm
