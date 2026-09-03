import { useState, useEffect } from 'react'
import { API_URL } from './config'
import PaymentList from './PaymentList'
import PaymentForm from './PaymentForm'

function PaymentPage() {
  const [payments, setPayments] = useState([])

  function loadPayments() {
    fetch(`${API_URL}/payments`)
      .then(response => response.json())
      .then(data => setPayments(data))
  }

  useEffect(() => {
    loadPayments()
  }, [])

  return (
    <div>
      <h1>Payments</h1>
      <PaymentForm onPaymentCreated={loadPayments} />
      <PaymentList payments={payments} />
    </div>
  )
}

export default PaymentPage
