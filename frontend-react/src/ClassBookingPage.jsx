import { useState, useEffect } from 'react'
import { API_URL } from './config'
import ClassBookingList from './ClassBookingList'
import ClassBookingForm from './ClassBookingForm'

function ClassBookingPage() {
  const [classBookings, setClassBookings] = useState([])

  function loadClassBookings() {
    fetch(`${API_URL}/classbookings`)
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
