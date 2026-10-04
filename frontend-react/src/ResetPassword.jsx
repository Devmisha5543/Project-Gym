import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from './config'
import { LockKeyhole, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'

function ResetPassword() {
  const { t } = useTranslation('auth')
  const [token] = useState(() => new URLSearchParams(window.location.search).get('token') || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    const referrerMeta = document.createElement('meta')
    referrerMeta.name = 'referrer'
    referrerMeta.content = 'no-referrer'
    document.head.appendChild(referrerMeta)
    window.history.replaceState(window.history.state, '', window.location.pathname)
    return () => referrerMeta.remove()
  }, [])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (password.length < 8) {
      setError(t('passwordTooShort'))
      return
    }
    if (password !== confirmPassword) {
      setError(t('passwordsDoNotMatch'))
      return
    }

    setIsSubmitting(true)
    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, new_password: password })
      })
      await response.json()
      if (!response.ok) {
        setError(t('resetFailed'))
        setIsSubmitting(false)
        return
      }
      localStorage.removeItem('token')
      localStorage.removeItem('adminName')
      setSuccess(true)
      window.setTimeout(() => navigate('/login', { replace: true }), 1200)
    } catch {
      setError(t('common:networkError'))
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-orbit login-orbit-one"></div>
      <div className="login-orbit login-orbit-two"></div>
      <section className="login-card">
        <div className="login-brand"><div className="login-brand-mark">PG</div><div><strong>Project Gym</strong><span>{t('managementPlatform')}</span></div></div>
        <div className="login-heading"><ShieldCheck size={20} /><span>{t('accountRecovery')}</span><h1>{t('resetPassword')}</h1><p>{t('chooseNewPassword')}</p></div>
        {success ? (
          <div className="settings-feedback-success" role="status">{t('passwordChanged')}</div>
        ) : !token ? (
          <div className="settings-feedback-error" role="alert">{t('invalidResetLink')}</div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field"><span>{t('newPassword')}</span><div className="login-input-wrap"><LockKeyhole size={17} /><input type="password" value={password} onChange={event => setPassword(event.target.value)} required minLength={8} autoComplete="new-password" /></div></label>
            <label className="login-field"><span>{t('confirmPassword')}</span><div className="login-input-wrap"><LockKeyhole size={17} /><input type="password" value={confirmPassword} onChange={event => setConfirmPassword(event.target.value)} required minLength={8} autoComplete="new-password" /></div></label>
            {error && <div className="settings-feedback-error" role="alert">{error}</div>}
            <button className="login-button" type="submit" disabled={isSubmitting}>{isSubmitting ? t('updating') : t('updatePassword')}</button>
          </form>
        )}
      </section>
    </main>
  )
}

export default ResetPassword
