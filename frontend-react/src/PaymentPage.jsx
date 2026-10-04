import { authFetch } from './authFetch'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import PaymentList from './PaymentList'
import PaymentForm from './PaymentForm'
import { CreditCard, Receipt } from 'lucide-react'
import { useLocation, useNavigate } from 'react-router-dom'

function PaymentPage() {
  const { t } = useTranslation(['payments', 'common'])
  const location = useLocation()
  const navigate = useNavigate()
  const renewalMembershipId = location.state?.renewalMembershipId
  const [payments, setPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadPayments = useCallback(() => {
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
      .then(data => setPayments(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load payments:', error)
        setPayments([])
        setPageError(t('paymentLoadFailed'))
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadPayments, 0)
    return () => clearTimeout(loadTimer)
  }, [loadPayments])

  return (
    <div className="page-container payments-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">
            {t('eyebrow')}
          </p>

          <h1>{t('paymentsTitle')}</h1>

          <p className="page-description">
            {t('paymentsDescription')}
          </p>
        </div>

        <div className="payment-total">
          <CreditCard size={19} />
          <span>
            {payments.length}
          </span>
          <small>
            {t('totalPayments')}
          </small>
        </div>
      </div>

      <PaymentForm
        onPaymentCreated={loadPayments}
        renewalMembershipId={renewalMembershipId}
        onRenewalComplete={() => navigate('/dashboard', { replace: true })}
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
          <h3>{t('loadingPayments')}</h3>
          <p>{t('gettingPaymentsReady')}</p>
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
