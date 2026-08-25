import { useState } from 'react'

function MembershipPlanForm({ onMembershipPlanCreated }) {
  const [planName, setPlanName] = useState('')
  const [price, setPrice] = useState('')
  const [perks, setPerks] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const newPlan = {
      plan_name: planName,
      price,
      perks
    }

    fetch("http://127.0.0.1:5000/membershipplans", {
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
      <br /><br />

      <label>Price:</label>
      <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required />
      <br /><br />

      <label>Perks:</label>
      <input type="text" value={perks} onChange={e => setPerks(e.target.value)} required />
      <br /><br />

      <button type="submit">Add Plan</button>
    </form>
  )
}

export default MembershipPlanForm
