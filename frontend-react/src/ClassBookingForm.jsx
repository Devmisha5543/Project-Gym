import { useState, useEffect } from 'react'
import { classBookingSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { CalendarCheck, CalendarDays, Dumbbell, Save, UserRound } from 'lucide-react'

function ClassBookingForm({ onClassBookingCreated }) {
  const [members, setMembers] = useState([])
  const [classes, setClasses] = useState([])
  const [memberId, setMemberId] = useState('')
  const [classId, setClassId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetch(`${API_URL}/members`)
      .then(response => response.json())
      .then(data => setMembers(data))

    fetch(`${API_URL}/classes`)
      .then(response => response.json())
      .then(data => setClasses(data))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const result = classBookingSchema.safeParse({ memberId, classId, bookingDate })
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const newBooking = {
      member_id: memberId,
      class_id: classId,
      booking_date: bookingDate,
      status
    }

    authFetch(`${API_URL}/classbookings`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBooking)
    })
      .then(response => response.json())
      .then(() => {
        setMemberId('')
        setClassId('')
        setBookingDate('')
        setStatus('')
        onClassBookingCreated()
      })
  }

  return (
    <section className="class-booking-form-section"><div className="class-booking-form-heading"><div className="class-booking-form-icon"><CalendarCheck size={19} /></div><div><h2>Book a Class</h2><p>Reserve a place for a member in a scheduled class.</p></div></div><form className="class-booking-form" onSubmit={handleSubmit}>
      <div className="class-booking-form-grid"><label className="class-booking-field"><span>Member</span><div className="class-booking-input-wrap"><UserRound size={16} /><select value={memberId} onChange={e => setMemberId(e.target.value)} required>
        <option value="">-- Select a member --</option>
        {members.map(member => (
          <option key={member.member_id} value={member.member_id}>{member.name}</option>
        ))}
      </select></div>
      {errors.memberId && <small className="class-booking-field-error">{errors.memberId}</small>}</label>

      <label className="class-booking-field"><span>Class</span><div className="class-booking-input-wrap"><Dumbbell size={16} /><select value={classId} onChange={e => setClassId(e.target.value)} required>
        <option value="">-- Select a class --</option>
        {classes.map(gymClass => (
          <option key={gymClass.class_id} value={gymClass.class_id}>{gymClass.class_name} - {gymClass.schedule_time}</option>
        ))}
      </select></div>
      {errors.classId && <small className="class-booking-field-error">{errors.classId}</small>}</label>

      <label className="class-booking-field"><span>Booking date</span><div className="class-booking-input-wrap"><CalendarDays size={16} /><input type="datetime-local" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required /></div>
      {errors.bookingDate && <small className="class-booking-field-error">{errors.bookingDate}</small>}</label>

      <label className="class-booking-field"><span>Status</span><div className="class-booking-input-wrap"><CalendarCheck size={16} /><select value={status} onChange={e => setStatus(e.target.value)} required>
        <option value="">-- Select status --</option>
        <option value="booked">Booked</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select></div></label></div>
      <div className="class-booking-form-actions"><button type="submit" className="class-booking-primary-button"><Save size={16} /> Add Booking</button></div>
    </form></section>
  )
}

export default ClassBookingForm
