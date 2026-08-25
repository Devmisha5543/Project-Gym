import { useState, useEffect } from 'react'

function ClassBookingForm({ onClassBookingCreated }) {
  const [members, setMembers] = useState([])
  const [classes, setClasses] = useState([])
  const [memberId, setMemberId] = useState('')
  const [classId, setClassId] = useState('')
  const [bookingDate, setBookingDate] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetch("http://127.0.0.1:5000/members")
      .then(response => response.json())
      .then(data => setMembers(data))

    fetch("http://127.0.0.1:5000/classes")
      .then(response => response.json())
      .then(data => setClasses(data))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const newBooking = {
      member_id: memberId,
      class_id: classId,
      booking_date: bookingDate,
      status
    }

    fetch("http://127.0.0.1:5000/classbookings", {
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
    <form onSubmit={handleSubmit}>
      <label>Member:</label>
      <select value={memberId} onChange={e => setMemberId(e.target.value)} required>
        <option value="">-- Select a member --</option>
        {members.map(member => (
          <option key={member.member_id} value={member.member_id}>{member.name}</option>
        ))}
      </select>
      <br /><br />

      <label>Class:</label>
      <select value={classId} onChange={e => setClassId(e.target.value)} required>
        <option value="">-- Select a class --</option>
        {classes.map(gymClass => (
          <option key={gymClass.class_id} value={gymClass.class_id}>{gymClass.class_name} - {gymClass.schedule_time}</option>
        ))}
      </select>
      <br /><br />

      <label>Booking_Date:</label>
      <input type="datetime-local" value={bookingDate} onChange={e => setBookingDate(e.target.value)} required />
      <br /><br />

      <label>Status:</label>
      <select value={status} onChange={e => setStatus(e.target.value)} required>
        <option value="">-- Select status --</option>
        <option value="booked">Booked</option>
        <option value="cancelled">Cancelled</option>
        <option value="completed">Completed</option>
      </select>
      <br /><br />

      <button type="submit">Add Class Booking</button>
    </form>
  )
}

export default ClassBookingForm
