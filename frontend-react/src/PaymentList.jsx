function PaymentList({ payments }) {
  return (
    <ul>
      {payments.map(payment => (
        <li key={payment.payment_id}>
          {payment.amount} - {payment.payment_date}
        </li>
      ))}
    </ul>
  )
}

export default PaymentList
