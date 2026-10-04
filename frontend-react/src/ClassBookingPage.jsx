import { authFetch } from './authFetch'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import ClassBookingList from './ClassBookingList'
import ClassBookingForm from './ClassBookingForm'
import { CalendarCheck, Receipt } from 'lucide-react'

function ClassBookingPage() {
  const { t } = useTranslation(['classes', 'common'])
  const [classBookings, setClassBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadClassBookings = useCallback(() => {
    setLoading(true)
    setPageError('')
    authFetch(`${API_URL}/classbookings`)
      .then(response => {
        if (!response.ok) throw new Error(`Bookings request failed: ${response.status}`)
        return response.json()
      })
      .then(data => setClassBookings(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load class bookings:', error)
        setClassBookings([])
        setPageError(t('bookingLoadFailed'))
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadClassBookings, 0)
    return () => clearTimeout(loadTimer)
  }, [loadClassBookings])

  return (
    <div className="page-container class-bookings-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{t('eyebrow')}</p>
          <h1>{t('bookingsTitle')}</h1>
          <p className="page-description">{t('bookingsDescription')}</p>
        </div>
        <div className="class-booking-total">
          <CalendarCheck size={19} />
          <span>{classBookings.length}</span>
          <small>{t('totalBookings')}</small>
        </div>
      </div>
      <ClassBookingForm onClassBookingCreated={loadClassBookings} />
      {pageError && (
        <div className="class-booking-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}
      {loading ? (
        <div className="class-booking-state">
          <div className="loading-spinner"></div>
          <h3>{t('loadingBookings')}</h3>
          <p>{t('gettingBookingsReady')}</p>
        </div>
      ) : (
        <ClassBookingList
          classBookings={classBookings}
          onClassBookingUpdated={loadClassBookings}
          onClassBookingDeleted={loadClassBookings}
        />
      )}
    </div>
  )
}

export default ClassBookingPage
