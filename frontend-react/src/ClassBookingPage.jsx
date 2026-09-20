import { useState, useEffect } from 'react'
import { API_URL } from './config'
import ClassBookingList from './ClassBookingList'
import ClassBookingForm from './ClassBookingForm'
import { CalendarCheck, Receipt } from 'lucide-react'

function ClassBookingPage() {
  const [classBookings, setClassBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadClassBookings() {
    setLoading(true)
    setPageError('')
    fetch(`${API_URL}/classbookings`)
      .then(response => {
        if (!response.ok) throw new Error(`Bookings request failed: ${response.status}`)
        return response.json()
      })
      .then(data => setClassBookings(data))
      .catch(error => {
        console.error('Failed to load class bookings:', error)
        setClassBookings([])
        setPageError('Unable to load class bookings. Please try again.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadClassBookings, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container class-bookings-page">
      <div className="page-header">
        <div><p className="page-eyebrow">GYM MANAGEMENT</p><h1>Class Bookings</h1><p className="page-description">Coordinate member reservations across your scheduled classes.</p></div>
        <div className="class-booking-total"><CalendarCheck size={19} /><span>{classBookings.length}</span><small>Total Bookings</small></div>
      </div>
      <ClassBookingForm onClassBookingCreated={loadClassBookings} />
      {pageError && <div className="class-booking-feedback"><Receipt size={17} /><span>{pageError}</span></div>}
      {loading ? <div className="class-booking-state"><div className="loading-spinner"></div><h3>Loading bookings</h3><p>Getting reservations ready.</p></div> : <ClassBookingList classBookings={classBookings} />}
    </div>
  )
}

export default ClassBookingPage
