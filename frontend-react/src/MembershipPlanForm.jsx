import { useState } from 'react'
import { membershipPlanSchema } from './schemas'
import { API_URL } from './config'

function MembershipPlanForm({ onMembershipPlanCreated }) {
  const [planName, setPlanName] = useState('')
  const [price, setPrice] = useState('')
  const [perks, setPerks] = useState('')
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()

    const result = membershipPlanSchema.safeParse({ planName, price })
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const newPlan = {
      plan_name: planName,
      price,
      perks
    }

    fetch(`${API_URL}/membershipplans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPlan)
    })
      .then(response => response.json())
      .then(() => {
        setPlanName('')
        setPrice('')
        setPerks('')
        onMembershipPlanCreated()
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Plan Name:</label>
      <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} required />
      {errors.planName && <p style={{ color: '#dc2626' }}>{errors.planName}</p>}
      <br /><br />

      <label>Price:</label>
      <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
      {errors.price && <p style={{ color: '#dc2626' }}>{errors.price}</p>}
      <br /><br />

      <label>Perks:</label>
      <input type="text" value={perks} onChange={e => setPerks(e.target.value)} required />
      <br /><br />

      <button type="submit">Add Plan</button>
    </form>
  )
}

export default MembershipPlanForm
