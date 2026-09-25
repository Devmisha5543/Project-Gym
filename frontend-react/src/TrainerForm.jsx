import { useState } from 'react'
import { trainerSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { Award, Mail, Phone, Plus, Save, UserRound } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function TrainerForm({ onTrainerCreated }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [certification, setCertification] = useState('')
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)

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
    setFeedback(null)
    setSubmitting(true)

    const newTrainer = { name, phone, email, certification }

    authFetch(`${API_URL}/trainers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTrainer)
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Unable to create trainer.')
        return data
      })
      .then(() => {
        setName('')
        setPhone('')
        setEmail('')
        setCertification('')
        onTrainerCreated()
        setFeedback({ type: 'success', message: 'Trainer created successfully.' })
      })
      .catch(error => setFeedback({ type: 'error', message: error.message || 'Unable to create trainer.' }))
      .finally(() => setSubmitting(false))
  }

  return (
    <section className="trainer-form-section">
      <div className="trainer-form-heading">
        <div className="trainer-form-icon">
          <Plus size={19} />
        </div>
        <div>
          <h2>Add New Trainer</h2>
          <p>Register a coach for your gym team.</p>
        </div>
      </div>

      <form className="trainer-form" onSubmit={handleSubmit}>
        <div className="trainer-form-grid">
          <label className="trainer-field">
            <span>Full name</span>
            <div className="trainer-input-wrap">
              <UserRound size={16} />
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="Enter trainer name" />
            </div>
            {errors.name && <small className="trainer-field-error">{errors.name}</small>}
          </label>

          <label className="trainer-field">
            <span>Phone</span>
            <div className="trainer-input-wrap">
              <Phone size={16} />
              <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required placeholder="Trainer phone number" />
            </div>
            {errors.phone && <small className="trainer-field-error">{errors.phone}</small>}
          </label>

          <label className="trainer-field">
            <span>Email</span>
            <div className="trainer-input-wrap">
              <Mail size={16} />
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="trainer@example.com" />
            </div>
            {errors.email && <small className="trainer-field-error">{errors.email}</small>}
          </label>

          <label className="trainer-field">
            <span>Certification</span>
            <div className="trainer-input-wrap">
              <Award size={16} />
              <input type="text" value={certification} onChange={e => setCertification(e.target.value)} required placeholder="e.g. Strength & Conditioning" />
            </div>
            {errors.certification && <small className="trainer-field-error">{errors.certification}</small>}
          </label>
        </div>

        <FeedbackMessage message={feedback?.message} type={feedback?.type} />
        <div className="trainer-form-actions">
          <button type="submit" className="trainer-primary-button" disabled={submitting}>
            <Save size={16} /> {submitting ? 'Creating...' : 'Add Trainer'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default TrainerForm
