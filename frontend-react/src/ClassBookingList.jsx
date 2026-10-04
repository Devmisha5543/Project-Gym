import { useState } from 'react'
import { CalendarDays, CalendarCheck, Dumbbell, UserRound, Pencil, Trash2, Save, X } from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function asDateTimeInput(value) {
  return value ? String(value).slice(0, 16) : ''
}

function ClassBookingList({ classBookings, onClassBookingUpdated, onClassBookingDeleted }) {
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
      if (!response.ok) throw new Error(data.error || 'Failed to update booking.')
      setEditingId(null)
      onClassBookingUpdated()
    } catch (err) {
      setError(err.message || 'Unable to update booking.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(booking) {
    if (!window.confirm(`Delete booking #${booking.booking_id}?`)) return
    setBusyId(booking.booking_id)
    setError('')
    try {
      const response = await authFetch(`${API_URL}/classbookings/${booking.booking_id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to delete booking.')
      onClassBookingDeleted()
    } catch (err) {
      setError(err.message || 'Unable to delete booking.')
    } finally {
      setBusyId(null)
    }
  }

  if (classBookings.length === 0) return <div className="class-booking-state"><div className="class-booking-state-icon"><CalendarCheck size={25} /></div><h3>No class bookings yet</h3><p>Create a booking above to see reservations here.</p></div>

  return (
    <>
      {error && <div className="class-booking-feedback" role="alert">{error}</div>}
      <div className="class-booking-list">
        {classBookings.map(booking => (
          <article className="class-booking-card" key={booking.booking_id}>
            <div className="class-booking-card-icon"><CalendarCheck size={20} /></div>
            <div className="class-booking-card-main">
              <div className="class-booking-card-title-row">
                <div><span className="class-booking-card-label">Booking #{booking.booking_id}</span><h2>Member #{booking.member_id}</h2></div>
                <span className={`class-booking-status class-booking-status-${String(booking.status || 'unknown').toLowerCase()}`}>{booking.status || 'Status unavailable'}</span>
              </div>
              <div className="class-booking-card-meta">
                <span><Dumbbell size={15} />Class #{booking.class_id}</span>
                <span><UserRound size={15} />Member #{booking.member_id}</span>
                <span><CalendarDays size={15} />{booking.booking_date}</span>
              </div>
              {editingId === booking.booking_id ? (
                <div className="class-booking-edit-fields">
                  <label>Booking date<input type="datetime-local" value={editForm.booking_date} onChange={e => setEditForm({ ...editForm, booking_date: e.target.value })} required /></label>
                  <label>Cancel date<input type="datetime-local" value={editForm.cancel_date} onChange={e => setEditForm({ ...editForm, cancel_date: e.target.value })} /></label>
                  <label>Status<select value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}><option value="booked">Booked</option><option value="cancelled">Cancelled</option><option value="completed">Completed</option></select></label>
                  <div className="equipment-card-actions">
                    <button type="button" className="equipment-primary-button" onClick={() => handleUpdate(booking)} disabled={busyId === booking.booking_id}><Save size={15} />Save</button>
                    <button type="button" className="equipment-secondary-button" onClick={() => setEditingId(null)} disabled={busyId === booking.booking_id}><X size={15} />Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="equipment-card-actions">
                  <button type="button" className="equipment-secondary-button" onClick={() => startEditing(booking)}><Pencil size={15} />Edit</button>
                  <button type="button" className="equipment-danger-button" onClick={() => handleDelete(booking)} disabled={busyId === booking.booking_id}><Trash2 size={15} />{busyId === booking.booking_id ? 'Deleting...' : 'Delete'}</button>
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
