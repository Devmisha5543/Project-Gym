import { useState, useEffect } from 'react'
import ClassBookingList from './ClassBookingList'
import ClassBookingForm from './ClassBookingForm'

function ClassBookingPage() {
  const [classBookings, setClassBookings] = useState([])

  function loadClassBookings() {
    fetch("http://127.0.0.1:5000/classbookings")
      .then(response => response.json())
      .then(data => setClassBookings(data))
  }

  useEffect(() => {
    loadClassBookings()
  }, [])

  return (
    <div>
      <h1>Class Bookings</h1>
      <ClassBookingForm onClassBookingCreated={loadClassBookings} />
      <ClassBookingList classBookings={classBookings} />
    </div>
  )
}

export default ClassBookingPage
