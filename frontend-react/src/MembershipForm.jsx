import { useState, useEffect } from 'react'
import { membershipSchema } from './schemas'
import { API_URL } from './config'

function MembershipForm({ onMembershipCreated }) {
  const [members, setMembers] = useState([])
  const [plans, setPlans] = useState([])
  const [memberId, setMemberId] = useState('')
  const [planId, setPlanId] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetch(`${API_URL}/members`)
      .then(response => response.json())
      .then(data => setMembers(data))

    fetch(`${API_URL}/membershipplans`)
      .then(response => response.json())
      .then(data => setPlans(data))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const result = membershipSchema.safeParse({ memberId, planId, startDate, endDate })
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const newMembership = {
      member_id: memberId,
      plan_id: planId,
      start_date: startDate,
      end_date: endDate,
      status
    }

    fetch(`${API_URL}/memberships`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMembership)
    })
      .then(response => response.json())
      .then(() => {
        setMemberId('')
        setPlanId('')
        setStartDate('')
        setEndDate('')
        setStatus('')
        onMembershipCreated()
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
      {errors.memberId && <p style={{ color: '#dc2626' }}>{errors.memberId}</p>}
      <br /><br />

      <label>Plan:</label>
      <select value={planId} onChange={e => setPlanId(e.target.value)} required>
        <option value="">-- Select a plan --</option>
        {plans.map(plan => (
          <option key={plan.plan_id} value={plan.plan_id}>{plan.plan_name} - ${plan.price}</option>
        ))}
      </select>
      {errors.planId && <p style={{ color: '#dc2626' }}>{errors.planId}</p>}
      <br /><br />

      <label>Start_Date:</label>
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
      {errors.startDate && <p style={{ color: '#dc2626' }}>{errors.startDate}</p>}
      <br /><br />

      <label>End_Date:</label>
      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
      {errors.endDate && <p style={{ color: '#dc2626' }}>{errors.endDate}</p>}
      <br /><br />

      <label>Status:</label>
      <select value={status} onChange={e => setStatus(e.target.value)} required>
        <option value="">-- Select status --</option>
        <option value="active">Active</option>
        <option value="expired">Expired</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <br /><br />

      <button type="submit">Add Membership</button>
    </form>
  )
}

export default MembershipForm
