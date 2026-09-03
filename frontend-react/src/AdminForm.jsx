import { useState } from 'react'
import { API_URL } from './config'

function AdminForm({ onAdminCreated }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

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
      <br /><br />

      <label>Email:</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <br /><br />

      <label>Phone:</label>
      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required />
      <br /><br />

      <button type="submit">Add Admin</button>
    </form>
  )
}

export default AdminForm
