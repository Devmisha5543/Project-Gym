import { useState } from 'react'
import { adminSchema } from './schemas'
import { API_URL } from './config'

function AdminForm({ onAdminCreated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()

    const result = adminSchema.safeParse({ name, email, phone })
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const newAdmin = { name, email, phone }

    fetch(`${API_URL}/admins`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAdmin)
    })
      .then(response => response.json())
      .then(() => {
        setName('')
        setEmail('')
        setPhone('')
        onAdminCreated()
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Name:</label>
      <input type="text" value={name} onChange={e => setName(e.target.value)} required />
      {errors.name && <p style={{ color: '#dc2626' }}>{errors.name}</p>}
      <br /><br />

      <label>Email:</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      {errors.email && <p style={{ color: '#dc2626' }}>{errors.email}</p>}
      <br /><br />

      <label>Phone:</label>
      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required />
      {errors.phone && <p style={{ color: '#dc2626' }}>{errors.phone}</p>}
      <br /><br />

      <button type="submit">Add Admin</button>
    </form>
  )
}

export default AdminForm
