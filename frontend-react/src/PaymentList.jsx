import { CalendarDays, CreditCard, FileText } from 'lucide-react'

function PaymentList({ payments }) {
  if (payments.length === 0) {
    return (
      <div className="payment-state payment-empty-state">
        <div className="payment-state-icon">
          <CreditCard size={25} />
        </div>
        <h3>No payments recorded</h3>
        <p>Record your first membership payment above to see it here.</p>
      </div>
    )
  }

  return (
    <div className="payment-list">
      {payments.map(payment => (
        <article className="payment-card" key={payment.payment_id}>
          <div className="payment-card-icon">
            <CreditCard size={20} />
          </div>
          <div className="payment-card-main">
            <div className="payment-card-title-row">
              <div>
                <span className="payment-card-label">Payment #{payment.payment_id}</span>
                <h2>${Number(payment.amount || 0).toFixed(2)}</h2>
              </div>
              <span className="payment-method-badge">
                <FileText size={13} /> {payment.payment_method}
              </span>
            </div>

            <div className="payment-card-details">
              <span><CreditCard size={15} />Membership #{payment.membership_id}</span>
              <span><CalendarDays size={15} />{payment.payment_date}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default PaymentList
