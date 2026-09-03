import { useState, useEffect } from 'react'
import { API_URL } from './config'

function DashboardPage() {
  const [expiring, setExpiring] = useState([])
  const [memberCount, setMemberCount] = useState(0)
  const [classCount, setClassCount] = useState(0)
  const [totalRevenue, setTotalRevenue] = useState(0)

  function loadExpiring() {
    fetch(`${API_URL}/memberships/expiring`)
      .then(response => response.json())
      .then(data => setExpiring(data))
  }

  function loadStats() {
    fetch(`${API_URL}/members`)
      .then(response => response.json())
      .then(data => setMemberCount(data.length))

    fetch(`${API_URL}/classes`)
      .then(response => response.json())
      .then(data => setClassCount(data.length))

    fetch(`${API_URL}/payments`)
      .then(response => response.json())
      .then(data => {
        const total = data.reduce((sum, payment) => sum + Number(payment.amount), 0)
        setTotalRevenue(total)
      })
  }

  useEffect(() => {
    loadExpiring()
    loadStats()
  }, [])

  return (
    <div>
      <h1>Manager Dashboard</h1>

      <div className="stats-row">
        <div className="card stat-card">
          <p className="stat-label">Active Members</p>
          <p className="stat-value">{memberCount}</p>
        </div>

        <div className="card stat-card">
          <p className="stat-label">Scheduled Classes</p>
          <p className="stat-value">{classCount}</p>
        </div>

        <div className="card stat-card">
          <p className="stat-label">Total Revenue</p>
          <p className="stat-value">${totalRevenue.toFixed(2)}</p>
        </div>
      </div>

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
