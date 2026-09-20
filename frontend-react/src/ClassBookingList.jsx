import { CalendarDays, CalendarCheck, Dumbbell, UserRound } from 'lucide-react'
function ClassBookingList({ classBookings }) {
  if (classBookings.length === 0) return <div className="class-booking-state"><div className="class-booking-state-icon"><CalendarCheck size={25} /></div><h3>No class bookings yet</h3><p>Create a booking above to see reservations here.</p></div>
  return (
    <div className="class-booking-list">
      {classBookings.map(booking => (
        <article className="class-booking-card" key={booking.booking_id}><div className="class-booking-card-icon"><CalendarCheck size={20} /></div><div className="class-booking-card-main"><div className="class-booking-card-title-row"><div><span className="class-booking-card-label">Booking #{booking.booking_id}</span><h2>Member #{booking.member_id}</h2></div><span className={`class-booking-status class-booking-status-${String(booking.status || 'unknown').toLowerCase()}`}>{booking.status || 'Status unavailable'}</span></div><div className="class-booking-card-meta"><span><Dumbbell size={15} />Class #{booking.class_id}</span><span><UserRound size={15} />Member #{booking.member_id}</span><span><CalendarDays size={15} />{booking.booking_date}</span></div></div></article>
      ))}
    </div>
  )
}

export default ClassBookingList
