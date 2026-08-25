function ClassBookingList({ classBookings }) {
  return (
    <ul>
      {classBookings.map(booking => (
        <li key={booking.booking_id}>
          Booking #{booking.booking_id} - Member {booking.member_id} - Class {booking.class_id} - {booking.booking_date} - {booking.status}
        </li>
      ))}
    </ul>
  )
}

export default ClassBookingList
