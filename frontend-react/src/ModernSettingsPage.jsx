import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  AlertCircle,
  Bell,
  Building2,
  Check,
  CheckCircle2,
  Coins,
  Globe,
  Image,
  Layers,
  Mail,
  MapPin,
  Monitor,
  Moon,
  Phone,
  RefreshCw,
  Save,
  Sun,
  UserCog,
} from 'lucide-react'
import { useGym } from './GymContext'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { useFeatureVisibility } from './FeatureVisibilityContext'
import { SIDEBAR_FEATURES } from './featureVisibility'
import { useTheme } from './ThemeContext'

const NOTIFICATION_STORAGE_KEY = 'project-gym-notification-preferences'

const DEFAULT_NOTIFICATIONS = {
  bookingUpdates: true,
  membershipReminders: true,
  trainerUpdates: true,
}

const THEME_OPTIONS = [
  { key: 'light', icon: Sun, title: 'themeLight', description: 'themeLightDescription' },
  { key: 'dark', icon: Moon, title: 'themeDark', description: 'themeDarkDescription' },
  { key: 'system', icon: Monitor, title: 'themeSystem', description: 'themeSystemDescription' },
]

function getInitialNotifications() {
  try {
    return {
      ...DEFAULT_NOTIFICATIONS,
      ...JSON.parse(localStorage.getItem(NOTIFICATION_STORAGE_KEY) || '{}'),
    }
  } catch {
    return DEFAULT_NOTIFICATIONS
  }
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      type="button"
      className={`settings-switch ${checked ? 'is-on' : ''}`}
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
    >
      <span className="settings-switch-thumb" />
    </button>
  )
}

function SectionHeader({ icon: Icon, title, description }) {
  return (
    <div className="modern-settings-section-header">
      <div className="modern-settings-icon-badge"><Icon size={17} /></div>
      <div>
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </div>
  )
}

function ModernSettingsPage() {
  const { t } = useTranslation(['settings', 'common', 'validation', 'navigation'])
  const { gym, loading, error, refreshGym, updateGym } = useGym()
  const { visibility, setFeatureVisibility } = useFeatureVisibility()
  const { theme, themePreference, setThemePreference } = useTheme()
  const [notifications, setNotifications] = useState(getInitialNotifications)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    currency: '',
    logo_url: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [submitError, setSubmitError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => {
    if (!gym) return
    // Form state mirrors the asynchronously loaded gym profile.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setFormData({
      name: gym.name || '',
      phone: gym.phone || '',
      email: gym.email || '',
      address: gym.address || '',
      currency: gym.currency || '',
      logo_url: gym.logo_url || '',
    })
  }, [gym])

  useEffect(() => {
    localStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(notifications))
  }, [notifications])

  function handleChange(field, value) {
    setFormData(current => ({ ...current, [field]: value }))
    setFieldErrors(current => ({ ...current, [field]: '' }))
    setSubmitError('')
    setSuccessMessage('')
  }

  function updateNotification(key, value) {
    setNotifications(current => ({ ...current, [key]: value }))
  }

  function resetDefaults() {
    SIDEBAR_FEATURES.forEach(feature => {
      setFeatureVisibility(feature.key, feature.defaultEnabled)
    })
    setNotifications(DEFAULT_NOTIFICATIONS)
    setThemePreference('system')
    setSuccessMessage('defaultsReset')
    setSubmitError('')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    const errors = {}
    if (!formData.name.trim()) errors.name = 'required'
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim())) {
      errors.email = 'validEmail'
    }
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      return
    }

    setFieldErrors({})
    setSubmitError('')
    setSuccessMessage('')
    setIsSaving(true)

    try {
      const response = await authFetch(`${API_URL}/gym`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name.trim(),
          phone: formData.phone.trim() || null,
          email: formData.email.trim() || null,
          address: formData.address.trim() || null,
          currency: formData.currency.trim() || null,
          logo_url: formData.logo_url.trim() || null,
        }),
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

      updateGym(data.gym || data)
      setSuccessMessage('saveSuccess')
    } catch (requestError) {
      console.error('Failed to save gym settings:', requestError)
      setSubmitError('networkError')
    } finally {
      setIsSaving(false)
    }
  }

  const pageHeader = (
    <header className="modern-settings-header">
      <div>
        <p className="modern-settings-eyebrow">{t('eyebrow')}</p>
        <h1>{t('title')}</h1>
        <p>{t('description')}</p>
      </div>
      <div className="modern-settings-org-id">
        <Building2 size={16} />
        <span>#{gym?.gym_id ?? 1}</span>
        <small>{t('organizationId')}</small>
      </div>
    </header>
  )

  if (loading && !gym) {
    return (
      <div className="modern-settings-page">
        {pageHeader}
        <div className="modern-settings-state">
          <RefreshCw size={22} className="refresh-icon-spinning" />
          <h3>{t('loadingGym')}</h3>
          <p>{t('loadingDescription')}</p>
        </div>
      </div>
    )
  }

  if (error && !gym) {
    return (
      <div className="modern-settings-page">
        {pageHeader}
        <div className="modern-settings-state is-error">
          <AlertCircle size={24} />
          <h3>{t('loadFailed')}</h3>
          <p>{t('common:unexpectedError')}</p>
          <button type="button" className="modern-settings-secondary-button" onClick={refreshGym}>
            <RefreshCw size={15} /> {t('common:retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="modern-settings-page">
      {pageHeader}

      {submitError && (
        <div className="modern-settings-feedback is-error" role="alert">
          <AlertCircle size={17} />
          <span>{t(submitError === 'networkError' ? 'common:networkError' : submitError)}</span>
        </div>
      )}
      {successMessage && (
        <div className="modern-settings-feedback is-success" role="status">
          <CheckCircle2 size={17} />
          <span>{t(successMessage)}</span>
        </div>
      )}

      <section className="modern-settings-card">
        <SectionHeader icon={Sun} title={t('appearance')} description={t('appearanceDescription')} />
        <div className="settings-theme-grid">
          {THEME_OPTIONS.map(option => {
            const Icon = option.icon
            const isActive = themePreference === option.key
            return (
              <button
                type="button"
                key={option.key}
                className={`settings-theme-card ${isActive ? 'is-active' : ''}`}
                onClick={() => setThemePreference(option.key)}
                aria-pressed={isActive}
              >
                <span className="settings-theme-icon"><Icon size={18} /></span>
                <span className="settings-theme-copy">
                  <strong>{t(option.title)}</strong>
                  <small>{t(option.description)}</small>
                </span>
                {isActive && <span className="settings-theme-check"><Check size={14} /></span>}
                {option.key === 'system' && <span className="settings-theme-current">{theme}</span>}
              </button>
            )
          })}
        </div>
      </section>

      <section className="modern-settings-card">
        <SectionHeader icon={Layers} title={t('sidebarPages')} description={t('sidebarPagesDescription')} />
        <div className="settings-module-list">
          {SIDEBAR_FEATURES.map(feature => (
            <div className="settings-module-row" key={feature.key}>
              <div className="settings-module-copy">
                <strong>{t(`navigation:${feature.label}`)}</strong>
                <span>{t(`featureDescriptions.${feature.key}`)}</span>
              </div>
              <Toggle
                checked={visibility[feature.key]}
                onChange={value => setFeatureVisibility(feature.key, value)}
                label={t(`navigation:${feature.label}`)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="modern-settings-card">
        <SectionHeader icon={Bell} title={t('notifications')} description={t('notificationsDescription')} />
        <div className="settings-module-list">
          {[
            ['bookingUpdates', 'bookingUpdates', 'bookingUpdatesDescription'],
            ['membershipReminders', 'membershipReminders', 'membershipRemindersDescription'],
            ['trainerUpdates', 'trainerUpdates', 'trainerUpdatesDescription'],
          ].map(([key, title, description]) => (
            <div className="settings-module-row" key={key}>
              <div className="settings-module-copy">
                <strong>{t(title)}</strong>
                <span>{t(description)}</span>
              </div>
              <Toggle
                checked={notifications[key]}
                onChange={value => updateNotification(key, value)}
                label={t(title)}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="modern-settings-card">
        <SectionHeader icon={Building2} title={t('profile')} description={t('profileDescription')} />
        <form className="modern-settings-form" onSubmit={handleSubmit}>
          <div className="modern-settings-grid">
            <label className="modern-settings-field">
              <span>{t('gymName')} <b>*</b></span>
              <div className="modern-settings-input">
                <Building2 size={16} />
                <input value={formData.name} onChange={event => handleChange('name', event.target.value)} placeholder={t('gymName')} disabled={isSaving} />
              </div>
              {fieldErrors.name && <small className="modern-settings-field-error">{t(`validation:${fieldErrors.name}`)}</small>}
            </label>
            <label className="modern-settings-field">
              <span>{t('common:phone')}</span>
              <div className="modern-settings-input">
                <Phone size={16} />
                <input value={formData.phone} onChange={event => handleChange('phone', event.target.value)} placeholder={t('common:phone')} disabled={isSaving} />
              </div>
            </label>
            <label className="modern-settings-field">
              <span>{t('common:email')}</span>
              <div className="modern-settings-input">
                <Mail size={16} />
                <input type="email" value={formData.email} onChange={event => handleChange('email', event.target.value)} placeholder="name@example.com" disabled={isSaving} />
              </div>
              {fieldErrors.email && <small className="modern-settings-field-error">{t(`validation:${fieldErrors.email}`)}</small>}
            </label>
            <label className="modern-settings-field">
              <span>{t('currency')}</span>
              <div className="modern-settings-input">
                <Coins size={16} />
                <input value={formData.currency} onChange={event => handleChange('currency', event.target.value)} placeholder="USD, ETB, EUR" disabled={isSaving} />
              </div>
            </label>
            <label className="modern-settings-field">
              <span>{t('common:address')}</span>
              <div className="modern-settings-input">
                <MapPin size={16} />
                <input value={formData.address} onChange={event => handleChange('address', event.target.value)} placeholder={t('common:address')} disabled={isSaving} />
              </div>
            </label>
            <label className="modern-settings-field">
              <span>{t('logoUrl')}</span>
              <div className="modern-settings-input">
                <Globe size={16} />
                <input type="url" value={formData.logo_url} onChange={event => handleChange('logo_url', event.target.value)} placeholder="https://example.com/logo.png" disabled={isSaving} />
              </div>
            </label>
          </div>
          {formData.logo_url && (
            <div className="modern-settings-logo-preview">
              <div className="modern-settings-logo-frame">
                <Image size={17} />
                <img src={formData.logo_url} alt={t('liveLogoPreview')} onError={event => { event.currentTarget.style.display = 'none' }} />
              </div>
              <span>{t('liveLogoPreview')}</span>
            </div>
          )}
          <div className="modern-settings-actions">
            <button type="button" className="modern-settings-secondary-button" onClick={resetDefaults}>
              <RefreshCw size={16} /> {t('resetDefaults')}
            </button>
            <button type="submit" className="modern-settings-primary-button" disabled={isSaving}>
              {isSaving ? <RefreshCw size={16} className="refresh-icon-spinning" /> : <Save size={16} />}
              {isSaving ? t('common:saving') : t('saveChanges')}
            </button>
          </div>
        </form>
      </section>

      <div className="modern-settings-footer-note">
        <UserCog size={15} /> {t('changesSavedLocally')}
      </div>
    </div>
  )
}

export default ModernSettingsPage
