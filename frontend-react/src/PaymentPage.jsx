import { authFetch } from './authFetch'
import { useState, useEffect } from 'react'
import { API_URL } from './config'
import PaymentList from './PaymentList'
import PaymentForm from './PaymentForm'
import { CreditCard, Receipt } from 'lucide-react'

function PaymentPage() {
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadPayments() {
    setLoading(true)
    setPageError('')

    authFetch(`${API_URL}/payments`)
      .then(response => {
        if (!response.ok) {
          throw new Error(
            `Payments request failed: ${response.status}`
          )
        }

        return response.json()
      })
      .then(data => setPayments(data))
      .catch(error => {
        console.error('Failed to load payments:', error)

        setPayments([])

        setPageError(
          'Unable to load payments. Please try again.'
        )
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadPayments, 0)

    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container payments-page">

      <div className="page-header">

        <div>
          <p className="page-eyebrow">
            GYM MANAGEMENT
          </p>

          <h1>Payments</h1>

          <p className="page-description">
            Record and review membership payments across your gym.
          </p>
        </div>

        <div className="payment-total">
          <CreditCard size={19} />

          <span>
            {payments.length}
          </span>

          <small>
            Total Payments
          </small>
        </div>

      </div>

      <PaymentForm
        onPaymentCreated={loadPayments}
      />

      {pageError && (
        <div className="payment-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (

        <div className="payment-state">

          <div className="loading-spinner"></div>

          <h3>
            Loading payments
          </h3>

          <p>
            Getting your transaction history ready.
          </p>

        </div>

      ) : (

        <PaymentList
          payments={payments}
          onPaymentUpdated={loadPayments}
          onPaymentDeleted={loadPayments}
        />

      )}

    </div>
  )
}

export default PaymentPage