import { useState } from 'react'
import { branchSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { Building2, MapPin, Phone, Plus, Save } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function BranchForm({ onBranchCreated }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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
    setFeedback(null)
    setSubmitting(true)

    const newBranch = { name, address, phone, city }

    authFetch(`${API_URL}/branches`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBranch)
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Unable to create branch.')
        return data
      })
      .then(() => {
        setName('')
        setAddress('')
        setPhone('')
        setCity('')
        onBranchCreated()
        setFeedback({ type: 'success', message: 'Branch created successfully.' })
      })
      .catch(error => setFeedback({ type: 'error', message: error.message || 'Unable to create branch.' }))
      .finally(() => setSubmitting(false))
  }

  return (
    <section className="branch-form-section">
      <div className="branch-form-heading">
        <div className="branch-form-icon">
          <Plus size={19} />
        </div>
        <div>
          <h2>Add New Branch</h2>
          <p>Register a location for your gym network.</p>
        </div>
      </div>

      <form className="branch-form" onSubmit={handleSubmit}>
        <div className="branch-form-grid">
          <label className="branch-field">
            <span>Branch name</span>
            <div className="branch-input-wrap">
              <Building2 size={16} />
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Downtown Gym" />
            </div>
            {errors.name && <small className="branch-field-error">{errors.name}</small>}
          </label>

          <label className="branch-field">
            <span>City</span>
            <div className="branch-input-wrap">
              <MapPin size={16} />
              <input type="text" value={city} onChange={e => setCity(e.target.value)} required placeholder="Enter city" />
            </div>
          </label>

          <label className="branch-field">
            <span>Address</span>
            <div className="branch-input-wrap">
              <MapPin size={16} />
              <input type="text" value={address} onChange={e => setAddress(e.target.value)} required placeholder="Street address" />
            </div>
          </label>

          <label className="branch-field">
            <span>Phone</span>
            <div className="branch-input-wrap">
              <Phone size={16} />
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Branch phone number" />
            </div>
            {errors.phone && <small className="branch-field-error">{errors.phone}</small>}
          </label>
        </div>

        <FeedbackMessage message={feedback?.message} type={feedback?.type} />
        <div className="branch-form-actions">
          <button type="submit" className="branch-primary-button" disabled={submitting}>
            <Save size={16} /> {submitting ? 'Creating...' : 'Add Branch'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default BranchForm
