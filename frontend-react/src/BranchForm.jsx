import { useState } from 'react'
import { branchSchema } from './schemas'
import { API_URL } from './config'

function BranchForm({ onBranchCreated }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()

    const result = branchSchema.safeParse({ name, phone })
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const newBranch = { name, address, phone, city }

    fetch(`${API_URL}/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBranch)
    })
      .then(response => response.json())
      .then(() => {
        setName('')
        setAddress('')
        setPhone('')
        setCity('')
        onBranchCreated()
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Name:</label>
      <input type="text" value={name} onChange={e => setName(e.target.value)} required />
      {errors.name && <p style={{ color: '#dc2626' }}>{errors.name}</p>}
      <br /><br />

      <label>Address:</label>
      <input type="text" value={address} onChange={e => setAddress(e.target.value)} required />
      <br /><br />

      <label>Phone:</label>
      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required />
      {errors.phone && <p style={{ color: '#dc2626' }}>{errors.phone}</p>}
      <br /><br />

      <label>City:</label>
      <input type="text" value={city} onChange={e => setCity(e.target.value)} required />
      <br /><br />

      <button type="submit">Add Branch</button>
    </form>
  )
}

export default BranchForm
