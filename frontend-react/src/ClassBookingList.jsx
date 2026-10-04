import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { CalendarDays, CalendarCheck, Dumbbell, UserRound, Pencil, Trash2, Save, X } from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function asDateTimeInput(value) {
  return value ? String(value).slice(0, 16) : ''
}

function ClassBookingList({ classBookings, onClassBookingUpdated, onClassBookingDeleted }) {
  const { t } = useTranslation(['classes', 'common'])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ booking_date: '', cancel_date: '', status: '' })
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  function startEditing(booking) {
    setEditingId(booking.booking_id)
    setEditForm({
      booking_date: asDateTimeInput(booking.booking_date),
      cancel_date: asDateTimeInput(booking.cancel_date),
      status: booking.status || 'booked'
    })
    setError('')
  }

  async function handleUpdate(booking) {
    setBusyId(booking.booking_id)
    setError('')
    try {
      const response = await authFetch(`${API_URL}/classbookings/${booking.booking_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          member_id: booking.member_id,
          class_id: booking.class_id,
          booking_date: editForm.booking_date,
          cancel_date: editForm.cancel_date || null,
          status: editForm.status
        })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || t('bookingUpdateFailed'))
      setEditingId(null)
      onClassBookingUpdated()
    } catch (err) {
      setError(err.message || t('bookingUpdateFailed'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(booking) {
    if (!window.confirm(t('deleteBookingConfirm', { id: booking.booking_id }))) return
    setBusyId(booking.booking_id)
    setError('')
    try {
      const response = await authFetch(`${API_URL}/classbookings/${booking.booking_id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || t('bookingDeleteFailed'))
      onClassBookingDeleted()
    } catch (err) {
      setError(err.message || t('bookingDeleteFailed'))
    } finally {
      setBusyId(null)
    }
  }

  if (classBookings.length === 0) {
    return (
      <div className="class-booking-state">
        <div className="class-booking-state-icon"><CalendarCheck size={25} /></div>
        <h3>{t('noBookings')}</h3>
        <p>{t('noBookingsDescription')}</p>
      </div>
    )
  }

  return (
    <>
      {error && <div className="class-booking-feedback" role="alert">{error}</div>}
      <div className="class-booking-list">
        {classBookings.map(booking => (
          <article className="class-booking-card" key={booking.booking_id}>
            <div className="class-booking-card-icon"><CalendarCheck size={20} /></div>
            <div className="class-booking-card-main">
              <div className="class-booking-card-title-row">
                <div>
                  <span className="class-booking-card-label">{t('bookingCardLabel', { id: booking.booking_id })}</span>
                  <h2>{t('memberItem', { id: booking.member_id })}</h2>
                </div>
                <span className={`class-booking-status class-booking-status-${String(booking.status || 'unknown').toLowerCase()}`}>
                  {booking.status || t('statusUnavailable')}
                </span>
              </div>
              <div className="class-booking-card-meta">
                <span><Dumbbell size={15} />{t('classCardLabel', { id: booking.class_id })}</span>
                <span><UserRound size={15} />{t('memberItem', { id: booking.member_id })}</span>
                <span><CalendarDays size={15} />{booking.booking_date}</span>
              </div>
              {editingId === booking.booking_id ? (
                <div className="class-booking-edit-fields">
                  <label>{t('bookingDate')}<input type="datetime-local" value={editForm.booking_date} onChange={e => setEditForm({ ...editForm, booking_date: e.target.value })} required /></label>
                  <label>{t('cancelDate')}<input type="datetime-local" value={editForm.cancel_date} onChange={e => setEditForm({ ...editForm, cancel_date: e.target.value })} /></label>
                  <label>{t('status', { ns: 'common' })}<select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}><option value="booked">{t('booked')}</option><option value="cancelled">{t('cancelled')}</option><option value="completed">{t('completed')}</option></select></label>
                  <div className="equipment-card-actions">
                    <button type="button" className="equipment-primary-button" onClick={() => handleUpdate(booking)} disabled={busyId === booking.booking_id}><Save size={15} />{t('save', { ns: 'common' })}</button>
                    <button type="button" className="equipment-secondary-button" onClick={() => setEditingId(null)} disabled={busyId === booking.booking_id}><X size={15} />{t('cancel', { ns: 'common' })}</button>
                  </div>
                </div>
              ) : (
                <div className="equipment-card-actions">
                  <button type="button" className="equipment-secondary-button" onClick={() => startEditing(booking)}><Pencil size={15} />{t('edit', { ns: 'common' })}</button>
                  <button type="button" className="equipment-danger-button" onClick={() => handleDelete(booking)} disabled={busyId === booking.booking_id}><Trash2 size={15} />{busyId === booking.booking_id ? t('deleting', { ns: 'common' }) : t('delete', { ns: 'common' })}</button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

export default ClassBookingList
