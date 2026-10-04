import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarDays,
  CreditCard,
  FileText,
  Pencil,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function PaymentList({ payments, onPaymentUpdated, onPaymentDeleted }) {
  const { t } = useTranslation(['payments', 'common'])
  const [editingId, setEditingId] = useState(null)
  const [memberships, setMemberships] = useState([])

  const [editMembershipId, setEditMembershipId] = useState('')
  const [editAmount, setEditAmount] = useState('')
  const [editPaymentDate, setEditPaymentDate] = useState('')
  const [editPaymentMethod, setEditPaymentMethod] = useState('')

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [operationError, setOperationError] = useState('')

  useEffect(() => {
    authFetch(`${API_URL}/memberships`)
      .then(response => {
        if (!response.ok) throw new Error(`Memberships request failed: ${response.status}`)
        return response.json()
      })
      .then(data => setMemberships(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load memberships:', error)
        setOperationError(t('membershipsLoadFailed'))
      })
  }, [t])

  function startEditing(payment) {
    setOperationError('')
    setEditingId(payment.payment_id)
    setEditMembershipId(String(payment.membership_id))
    setEditAmount(payment.amount)
    setEditPaymentDate(formatDateTimeForInput(payment.payment_date))
    setEditPaymentMethod(payment.payment_method || '')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditMembershipId('')
    setEditAmount('')
    setEditPaymentDate('')
    setEditPaymentMethod('')
  }

  function formatDateTimeForInput(value) {
    if (!value) return ''

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 16)
    }

    const offset = date.getTimezoneOffset()
    const localDate = new Date(date.getTime() - offset * 60000)

    return localDate.toISOString().slice(0, 16)
  }

  function handleUpdate(paymentId) {
    setSaving(true)
    setOperationError('')

    const updatedPayment = {
      membership_id: editMembershipId,
      amount: editAmount,
      payment_date: editPaymentDate,
      payment_method: editPaymentMethod
    }

    authFetch(`${API_URL}/payments/${paymentId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedPayment)
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || t('paymentUpdateFailed'))
        return data
      })
      .then(() => {
        cancelEditing()
        onPaymentUpdated()
      })
      .catch(error => {
        console.error('Failed to update payment:', error)
        setOperationError(error.message || t('paymentUpdateFailed'))
      })
      .finally(() => {
        setSaving(false)
      })
  }

  function handleDelete(paymentId) {
    const confirmed = window.confirm(
      t('deletePaymentConfirm', { id: paymentId })
    )

    if (!confirmed) return

    setDeletingId(paymentId)
    setOperationError('')

    authFetch(`${API_URL}/payments/${paymentId}`, {
      method: 'DELETE'
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || t('paymentDeleteFailed'))
        return data
      })
      .then(() => {
        onPaymentDeleted()
      })
      .catch(error => {
        console.error('Failed to delete payment:', error)
        setOperationError(error.message || t('paymentDeleteFailed'))
      })
      .finally(() => {
        setDeletingId(null)
      })
  }

  if (payments.length === 0) {
    return (
      <div className="payment-state payment-empty-state">
        <div className="payment-state-icon">
          <CreditCard size={25} />
        </div>

        <h3>{t('noPayments')}</h3>
        <p>{t('noPaymentsDescription')}</p>
      </div>
    )
  }

  return (
    <div className="payment-list">
      {operationError && (
        <div className="payment-feedback" role="alert">
          {operationError}
        </div>
      )}

      {payments.map(payment => (
        <article
          className="payment-card"
          key={payment.payment_id}
        >
          <div className="payment-card-icon">
            <CreditCard size={20} />
          </div>

          <div className="payment-card-main">

            {editingId === payment.payment_id ? (

              /* EDIT MODE */
              <div className="payment-edit-form">

                <div className="payment-edit-grid">

                  <label className="payment-field">
                    <span>{t('membership', { defaultValue: 'Membership' })}</span>

                    <div className="payment-input-wrap">
                      <CreditCard size={16} />

                      <select
                        value={editMembershipId}
                        onChange={e =>
                          setEditMembershipId(e.target.value)
                        }
                      >
                        {memberships.map(membership => (
                          <option
                            key={membership.membership_id}
                            value={membership.membership_id}
                          >
                            {t('membershipLabel', { id: membership.membership_id })} ({t('memberLabel', { id: membership.member_id })})
                          </option>
                        ))}
                      </select>
                    </div>
                  </label>

                  <label className="payment-field">
                    <span>{t('amount')}</span>

                    <div className="payment-input-wrap">
                      <CreditCard size={16} />

                      <input
                        type="number"
                        step="0.01"
                        value={editAmount}
                        onChange={e =>
                          setEditAmount(e.target.value)
                        }
                      />
                    </div>
                  </label>

                  <label className="payment-field">
                    <span>{t('paymentDate')}</span>

                    <div className="payment-input-wrap">
                      <CalendarDays size={16} />

                      <input
                        type="datetime-local"
                        value={editPaymentDate}
                        onChange={e =>
                          setEditPaymentDate(e.target.value)
                        }
                      />
                    </div>
                  </label>

                  <label className="payment-field">
                    <span>{t('paymentMethod')}</span>

                    <div className="payment-input-wrap">
                      <FileText size={16} />

                      <input
                        type="text"
                        value={editPaymentMethod}
                        onChange={e =>
                          setEditPaymentMethod(e.target.value)
                        }
                      />
                    </div>
                  </label>

                </div>

                <div className="payment-card-actions">

                  <button
                    type="button"
                    className="payment-primary-button"
                    onClick={() =>
                      handleUpdate(payment.payment_id)
                    }
                    disabled={saving}
                  >
                    <Save size={15} />

                    {saving
                      ? t('saving', { ns: 'common' })
                      : t('saveChanges', { ns: 'common' })}
                  </button>

                  <button
                    type="button"
                    className="payment-secondary-button"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    <X size={15} />
                    {t('cancel', { ns: 'common' })}
                  </button>

                </div>

              </div>

            ) : (

              /* NORMAL MODE */
              <>
                <div className="payment-card-title-row">

                  <div>
                    <span className="payment-card-label">
                      {t('paymentCardLabel', { id: payment.payment_id })}
                    </span>

                    <h2>
                      ${Number(payment.amount || 0).toFixed(2)}
                    </h2>
                  </div>

                  <span className="payment-method-badge">
                    <FileText size={13} />
                    {payment.payment_method}
                  </span>

                </div>

                <div className="payment-card-details">

                  <span>
                    <CreditCard size={15} />
                    {t('membershipLabel', { id: payment.membership_id })}
                  </span>

                  <span>
                    <CalendarDays size={15} />
                    {payment.payment_date}
                  </span>

                </div>

                <div className="payment-card-actions">

                  <button
                    type="button"
                    className="payment-secondary-button"
                    onClick={() => startEditing(payment)}
                  >
                    <Pencil size={15} />
                    {t('edit', { ns: 'common' })}
                  </button>

                  <button
                    type="button"
                    className="payment-danger-button"
                    onClick={() =>
                      handleDelete(payment.payment_id)
                    }
                    disabled={
                      deletingId === payment.payment_id
                    }
                  >
                    <Trash2 size={15} />

                    {deletingId === payment.payment_id
                      ? t('deleting', { ns: 'common' })
                      : t('delete', { ns: 'common' })}
                  </button>

                </div>
              </>

            )}

          </div>
        </article>
      ))}
    </div>
  )
}

export default PaymentList
