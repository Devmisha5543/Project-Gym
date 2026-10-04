import { useState, useEffect } from 'react'
import { useGym } from './GymContext'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { useTranslation } from 'react-i18next'
import LanguageSelector from './LanguageSelector'
import {
  Building2,
  Save,
  Phone,
  Mail,
  MapPin,
  Coins,
  Link as LinkIcon,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react'

function SettingsPage() {
  const { t } = useTranslation(['settings', 'common', 'validation'])
  const { gym, loading, error, refreshGym, updateGym } = useGym()

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    currency: '',
    logo_url: ''
  })

  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  // Populate form with current gym data
  useEffect(() => {
    if (gym) {
      setFormData({
        name: gym.name || '',
        phone: gym.phone || '',
        email: gym.email || '',
        address: gym.address || '',
        currency: gym.currency || '',
        logo_url: gym.logo_url || ''
      })
    }
  }, [gym])

  function handleChange(field, value) {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (fieldErrors[field]) {
      setFieldErrors(prev => ({ ...prev, [field]: '' }))
    }
    if (submitError) setSubmitError('')
    if (successMessage) setSuccessMessage('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    // Validate inputs
    const errors = {}
    if (!formData.name || !formData.name.trim()) {
      errors.name = 'required'
    }
    if (formData.email && formData.email.trim()) {
      const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailPattern.test(formData.email.trim())) {
        errors.email = 'validEmail'
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSubmitError('')
    setSuccessMessage('')
    setIsSaving(true)

    // Only send editable fields. Do not send gym_id or created_at.
    const payload = {
      name: formData.name.trim(),
      phone: formData.phone.trim() || null,
      email: formData.email.trim() || null,
      address: formData.address.trim() || null,
      currency: formData.currency.trim() || null,
      logo_url: formData.logo_url.trim() || null
    }

    try {
      const response = await authFetch(`${API_URL}/gym`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (response.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return
      }

      const data = await response.json()

      if (!response.ok) {
      setSubmitError('updateFailed')
        return
      }

      // Update shared gym context
      const updatedGym = data.gym || data
      updateGym(updatedGym)
      setSuccessMessage('saveSuccess')
    } catch (err) {
      console.error('Failed to save gym settings:', err)
      setSubmitError('networkError')
    } finally {
      setIsSaving(false)
    }
  }

  // Initial loading state
  if (loading && !gym) {
    return (
      <div className="page-container settings-page">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">{t('eyebrow')}</p>
            <h1>{t('title')}</h1>
            <p className="page-description">
              {t('description')}
            </p>
          </div>
        </div>

        <div className="branch-state">
          <RefreshCw size={24} className="refresh-icon-spinning" style={{ color: '#c48bff' }} />
          <h3>{t('loadingGym')}</h3>
          <p>{t('loadingDescription')}</p>
        </div>
      </div>
    )
  }

  // Initial load error state
  if (error && !gym) {
    return (
      <div className="page-container settings-page">
        <div className="page-header">
          <div>
            <p className="page-eyebrow">{t('eyebrow')}</p>
            <h1>{t('title')}</h1>
            <p className="page-description">
              {t('description')}
            </p>
          </div>
        </div>

        <div className="branch-state">
          <AlertCircle size={28} style={{ color: '#f87171' }} />
          <h3 style={{ color: '#f87171' }}>{t('loadFailed')}</h3>
          <p>{t('common:unexpectedError')}</p>
          <button
            type="button"
            onClick={refreshGym}
            className="branch-primary-button"
            style={{ marginTop: '16px' }}
          >
            <RefreshCw size={15} /> {t('common:retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="page-container settings-page">
      {/* HEADER */}
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{t('eyebrow')}</p>
          <h1>{t('title')}</h1>
          <p className="page-description">
            {t('description')}
          </p>
        </div>

        <div
          className="branch-total"
          style={{ borderColor: 'rgba(170, 59, 255, 0.22)', background: 'rgba(170, 59, 255, 0.08)' }}
        >
          <Building2 size={19} />
          <span>#{gym?.gym_id ?? 1}</span>
          <small>{t('organizationId')}</small>
        </div>
      </div>

      {/* FEEDBACK MESSAGES */}
      {submitError && (
        <div className="settings-feedback-error">
          <AlertCircle size={17} />
          <span>{t(submitError === 'networkError' ? 'common:networkError' : submitError)}</span>
        </div>
      )}

      {successMessage && (
        <div className="settings-feedback-success">
          <CheckCircle2 size={17} />
          <span>{t(successMessage)}</span>
        </div>
      )}

      <section className="settings-form-section settings-language-section">
        <div className="settings-form-heading">
          <div className="settings-form-icon"><span aria-hidden="true">文</span></div>
          <div><h2>{t('language')}</h2><p>{t('languageDescription')}</p></div>
        </div>
        <LanguageSelector />
      </section>

      {/* MAIN CONTENT: GYM PROFILE */}
      <section className="settings-form-section">
        <div className="settings-form-heading">
          <div className="settings-form-icon">
            <Building2 size={19} />
          </div>
          <div>
            <h2>{t('profile')}</h2>
            <p>{t('profileDescription')}</p>
          </div>
        </div>

        <form className="settings-form" onSubmit={handleSubmit}>
          <div className="settings-form-grid">
            {/* GYM NAME */}
            <label className="settings-field">
              <span>{t('gymName')} *</span>
              <div className="settings-input-wrap">
                <Building2 size={16} />
                <input
                  type="text"
                  value={formData.name}
                  onChange={e => handleChange('name', e.target.value)}
                  placeholder={t('gymName')}
                  required
                  disabled={isSaving}
                />
              </div>
              {fieldErrors.name && (
                <small className="settings-field-error">{t(`validation:${fieldErrors.name}`)}</small>
              )}
            </label>

            {/* CURRENCY */}
            <label className="settings-field">
              <span>{t('currency')}</span>
              <div className="settings-input-wrap">
                <Coins size={16} />
                <input
                  type="text"
                  value={formData.currency}
                  onChange={e => handleChange('currency', e.target.value)}
                  placeholder="e.g. USD, ETB, EUR"
                  disabled={isSaving}
                />
              </div>
            </label>

            {/* PHONE */}
            <label className="settings-field">
              <span>{t('common:phone')}</span>
              <div className="settings-input-wrap">
                <Phone size={16} />
                <input
                  type="text"
                  value={formData.phone}
                  onChange={e => handleChange('phone', e.target.value)}
                  placeholder={t('common:phone')}
                  disabled={isSaving}
                />
              </div>
            </label>

            {/* EMAIL */}
            <label className="settings-field">
              <span>{t('common:email')}</span>
              <div className="settings-input-wrap">
                <Mail size={16} />
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => handleChange('email', e.target.value)}
                  placeholder="name@example.com"
                  disabled={isSaving}
                />
              </div>
              {fieldErrors.email && (
                <small className="settings-field-error">{t(`validation:${fieldErrors.email}`)}</small>
              )}
            </label>

            {/* ADDRESS */}
            <label className="settings-field">
              <span>{t('common:address')}</span>
              <div className="settings-input-wrap">
                <MapPin size={16} />
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => handleChange('address', e.target.value)}
                  placeholder={t('common:address')}
                  disabled={isSaving}
                />
              </div>
            </label>

            {/* LOGO URL */}
            <label className="settings-field">
              <span>{t('logoUrl')}</span>
              <div className="settings-input-wrap">
                <LinkIcon size={16} />
                <input
                  type="url"
                  value={formData.logo_url}
                  onChange={e => handleChange('logo_url', e.target.value)}
                  placeholder="https://example.com/logo.png"
                  disabled={isSaving}
                />
              </div>
              {formData.logo_url && (
                <div className="logo-preview-box">
                  <img
                    src={formData.logo_url}
                    alt={t('liveLogoPreview')}
                    className="logo-preview-img"
                    onError={(e) => { e.currentTarget.style.display = 'none' }}
                    onLoad={(e) => { e.currentTarget.style.display = 'block' }}
                  />
                  <small style={{ color: '#888' }}>{t('liveLogoPreview')}</small>
                </div>
              )}
            </label>
          </div>

          <div className="settings-form-actions">
            <button
              type="submit"
              className="branch-primary-button"
              disabled={isSaving}
            >
              {isSaving ? (
                <>
                  <RefreshCw size={16} className="refresh-icon-spinning" /> {t('common:saving')}
                </>
              ) : (
                <>
                  <Save size={16} /> {t('saveSettings')}
                </>
              )}
            </button>
          </div>
        </form>
      </section>
    </div>
  )
}

export default SettingsPage
