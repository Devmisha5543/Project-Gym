import { useState, useEffect } from 'react'

function DashboardPage() {
  const [expiring, setExpiring] = useState([])

  function loadExpiring() {
    fetch("http://127.0.0.1:5000/memberships/expiring")
      .then(response => response.json())
      .then(data => setExpiring(data))
  }

  useEffect(() => {
    loadExpiring()
  }, [])

  return (
    <div>
      <h1>Manager Dashboard</h1>
      <h2>Memberships Expiring Soon</h2>

      {expiring.length === 0 ? (
        <p>No memberships expiring in the next 7 days.</p>
      ) : (
        <ul>
          {expiring.map(membership => (
            <li key={membership.membership_id}>
              {membership.member_name} ({membership.member_phone}) — expires {membership.end_date}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default DashboardPage