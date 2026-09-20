import { useState } from 'react'
import { adminSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { Mail, Phone, Save, ShieldCheck, UserRound } from 'lucide-react'

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

    authFetch(`${API_URL}/admins`, {
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
    <section className="admin-form-section"><div className="admin-form-heading"><div className="admin-form-icon"><ShieldCheck size={19} /></div><div><h2>Add Administrator</h2><p>Create an admin account with secure credentials.</p></div></div><form className="admin-form" onSubmit={handleSubmit}><div className="admin-form-grid"><label className="admin-field"><span>Name</span><div className="admin-input-wrap"><UserRound size={16} /><input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Full name" /></div>{errors.name && <small className="admin-field-error">{errors.name}</small>}</label><label className="admin-field"><span>Email</span><div className="admin-input-wrap"><Mail size={16} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="admin@example.com" /></div>{errors.email && <small className="admin-field-error">{errors.email}</small>}</label><label className="admin-field"><span>Phone</span><div className="admin-input-wrap"><Phone size={16} /><input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Phone number" /></div>{errors.phone && <small className="admin-field-error">{errors.phone}</small>}</label></div><div className="admin-form-actions"><button type="submit" className="admin-primary-button"><Save size={16} /> Add Admin</button></div></form></section>
  )
}

export default AdminForm
