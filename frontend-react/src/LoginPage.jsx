import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from './config'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import GoogleAuthButton from './GoogleAuthButton'
import './auth-redesign.css'

function LoginPage() {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  function validateForm() {
    const nextErrors = {}
    const normalizedEmail = email.trim()

    if (!normalizedEmail) {
      nextErrors.email = t('emailRequired')
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      nextErrors.email = t('emailInvalid')
    }

    if (!password) {
      nextErrors.password = t('passwordRequired')
    }

    setFieldErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (!validateForm()) return

    setIsSubmitting(true)

    fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email.trim(), password })
    })
      .then(response => response.json().then(data => ({ status: response.status, data })))
      .then(({ status, data }) => {
        if (status !== 200) {
          if (status === 401) {
            setError(t('invalidCredentials'))
          } else if (status === 423) {
            setError(t('accountLocked'))
          } else if (status === 429) {
            setError(t('loginRateLimited'))
          } else {
            setError(t('loginFailed'))
          }
          setIsSubmitting(false)
          return
        }

        localStorage.setItem('token', data.token)
        localStorage.setItem('adminName', data.name)
        navigate('/dashboard')
      })
      .catch(() => {
        setError(t('common:networkError'))
        setIsSubmitting(false)
      })
  }

  return (
    <main className="login-page">
      <section className="login-card" aria-labelledby="login-title">
        <div className="login-brand">
          <div className="login-brand-mark" aria-hidden="true">PG</div>
          <div>
            <strong>Project Gym</strong>
            <span>{t('managementPlatform', { defaultValue: 'Gym management platform' })}</span>
          </div>
        </div>

        <div className="login-heading">
          <span className="login-kicker">{t('secureAdminAccess')}</span>
          <h1 id="login-title">{t('loginTitle')}</h1>
          <p>{t('loginDescription')}</p>
        </div>

        <form className="login-form" onSubmit={handleSubmit} noValidate>
          <label className="login-field">
            <span>{t('emailAddress')}</span>
            <div className={`login-input-wrap${fieldErrors.email ? ' has-error' : ''}`}>
              <Mail size={17} aria-hidden="true" />
              <input
                type="email"
                value={email}
                onChange={event => {
                  setEmail(event.target.value)
                  setFieldErrors(current => ({ ...current, email: '' }))
                  setError('')
                }}
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(fieldErrors.email)}
                aria-describedby={fieldErrors.email ? 'login-email-error' : undefined}
              />
            </div>
            {fieldErrors.email && <span className="login-field-error" id="login-email-error">{fieldErrors.email}</span>}
          </label>

          <label className="login-field">
            <span>{t('password')}</span>
            <div className={`login-input-wrap${fieldErrors.password ? ' has-error' : ''}`}>
              <LockKeyhole size={17} aria-hidden="true" />
              <input
                type="password"
                value={password}
                onChange={event => {
                  setPassword(event.target.value)
                  setFieldErrors(current => ({ ...current, password: '' }))
                  setError('')
                }}
                autoComplete="current-password"
                placeholder={t('enterPassword')}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={fieldErrors.password ? 'login-password-error' : undefined}
              />
            </div>
            {fieldErrors.password && <span className="login-field-error" id="login-password-error">{fieldErrors.password}</span>}
          </label>

          <div className="login-forgot-row">
            <Link to="/forgot-password">{t('forgotPassword')}</Link>
          </div>

          {error && (
            <div className="login-error" role="alert">
              <ShieldCheck size={16} aria-hidden="true" />
              <span>{error}</span>
              {error === t('accountLocked') && (
                <p className="login-error-help">{t('accountLockedHelp')}</p>
              )}
            </div>
          )}

          <button className="login-button" type="submit" disabled={isSubmitting}>
            {isSubmitting ? t('signingIn') : <>{t('signIn')} <ArrowRight size={16} /></>}
          </button>
        </form>

        <div className="login-divider"><span>{t('or')}</span></div>
        <GoogleAuthButton />
      </section>
    </main>
  )
}

export default LoginPage
