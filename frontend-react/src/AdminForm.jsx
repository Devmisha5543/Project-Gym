import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { adminSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import {
  KeyRound,
  Mail,
  Phone,
  Save,
  ShieldCheck,
  UserRound
} from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function AdminForm({ onAdminCreated }) {
  const { t } = useTranslation(['admin', 'common'])
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [saving, setSaving] = useState(false)

  function handleSubmit(event) {
    event.preventDefault()

    setSubmitError('')
    setSuccessMessage('')

    const result = adminSchema.safeParse({
      name,
      email,
      phone,
      password
    })

    if (!result.success) {
      const fieldErrors = {}

      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })

      setErrors(fieldErrors)
      return
    }

    setErrors({})
    setSaving(true)

    const newAdmin = {
      name,
      email,
      phone,
      password
    }

    authFetch(`${API_URL}/admins`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(newAdmin)
    })
      .then(async response => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || t('adminCreateFailed'))
        }

        return data
      })
      .then(() => {
        setName('')
        setEmail('')
        setPhone('')
        setPassword('')
        onAdminCreated()
        setSuccessMessage(t('adminCreated'))
      })
      .catch(error => {
        console.error('Failed to create admin:', error)
        setSubmitError(error.message || t('adminCreateFailed'))
      })
      .finally(() => {
        setSaving(false)
      })
  }

  return (
    <section className="admin-form-section">
      <div className="admin-form-heading">
        <div className="admin-form-icon">
          <ShieldCheck size={19} />
        </div>

        <div>
          <h2>{t('addAdmin')}</h2>
          <p>{t('addAdminDescription')}</p>
        </div>
      </div>

      <form className="admin-form" onSubmit={handleSubmit}>
        <div className="admin-form-grid">

          <label className="admin-field">
            <span>{t('name')}</span>

            <div className="admin-input-wrap">
              <UserRound size={16} />

              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                required
                placeholder={t('fullName')}
              />
            </div>

            {errors.name && (
              <small className="admin-field-error">
                {errors.name}
              </small>
            )}
          </label>

          <label className="admin-field">
            <span>{t('email')}</span>

            <div className="admin-input-wrap">
              <Mail size={16} />

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder={t('emailPlaceholder')}
              />
            </div>

            {errors.email && (
              <small className="admin-field-error">
                {errors.email}
              </small>
            )}
          </label>

          <label className="admin-field">
            <span>{t('phone')}</span>

            <div className="admin-input-wrap">
              <Phone size={16} />

              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                required
                placeholder={t('phonePlaceholder')}
              />
            </div>

            {errors.phone && (
              <small className="admin-field-error">
                {errors.phone}
              </small>
            )}
          </label>

          <label className="admin-field">
            <span>{t('password')}</span>

            <div className="admin-input-wrap">
              <KeyRound size={16} />

              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder={t('temporaryPassword')}
              />
            </div>

            {errors.password && (
              <small className="admin-field-error">
                {errors.password}
              </small>
            )}
          </label>

        </div>

        {submitError && (
          <div className="admin-feedback admin-form-error">
            {submitError}
          </div>
        )}

        <FeedbackMessage message={successMessage} type="success" />

        <div className="admin-form-actions">
          <button
            type="submit"
            className="admin-primary-button"
            disabled={saving}
          >
            <Save size={16} />

            {saving ? t('creating') : t('addAdmin')}
          </button>
        </div>
      </form>
    </section>
  )
}

export default AdminForm
