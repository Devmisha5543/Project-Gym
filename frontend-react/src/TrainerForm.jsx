import { useState } from 'react'
import { trainerSchema } from './schemas'
import { API_URL } from './config'

function TrainerForm({ onTrainerCreated }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [certification, setCertification] = useState('')
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()

    const result = trainerSchema.safeParse({ name, phone, email, certification })
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const newTrainer = { name, phone, email, certification }

    fetch(`${API_URL}/trainers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTrainer)
    })
      .then(response => response.json())
      .then(() => {
        setName('')
        setPhone('')
        setEmail('')
        setCertification('')
        onTrainerCreated()
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Name:</label>
      <input type="text" value={name} onChange={e => setName(e.target.value)} required />
      {errors.name && <p style={{ color: '#dc2626' }}>{errors.name}</p>}
      <br /><br />

      <label>Phone:</label>
      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required />
      {errors.phone && <p style={{ color: '#dc2626' }}>{errors.phone}</p>}
      <br /><br />

      <label>Email:</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      {errors.email && <p style={{ color: '#dc2626' }}>{errors.email}</p>}
      <br /><br />

      <label>Certificate:</label>
      <input type="text" value={certification} onChange={e => setCertification(e.target.value)} required />
      {errors.certification && <p style={{ color: '#dc2626' }}>{errors.certification}</p>}
      <br /><br />

      <button type="submit">Add Trainer</button>
    </form>
  )
}

export default TrainerForm
