import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from './config'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import GoogleAuthButton from './GoogleAuthButton'
import FeedbackMessage from './FeedbackMessage'

function ForgotPassword() {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    setError('')
    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      if (!response.ok) throw new Error(t('common:networkError'))
      setSubmitted(true)
    } catch {
      setError(t('common:networkError'))
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main className="login-page">
      <div className="login-orbit login-orbit-one"></div>
      <div className="login-orbit login-orbit-two"></div>
      <section className="login-card">
        <div className="login-brand"><div className="login-brand-mark">PG</div><div><strong>Project Gym</strong><span>{t('managementPlatform')}</span></div></div>
        <div className="login-heading"><ShieldCheck size={20} /><span>{t('accountRecovery')}</span><h1>{t('forgotPasswordTitle')}</h1><p>{t('forgotPasswordDescription')}</p></div>
        {submitted ? (
          <FeedbackMessage message={t('resetLinkSent')} type="success" />
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <FeedbackMessage message={error} />
            <label className="login-field"><span>{t('emailAddress')}</span><div className="login-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" /></div></label>
            <button className="login-button" type="submit" disabled={isSubmitting}>{isSubmitting ? t('sending') : t('sendResetLink')}</button>
          </form>
        )}
        <GoogleAuthButton />
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18, color: '#c48bff', fontSize: 12, textDecoration: 'none' }}><ArrowLeft size={14} /> {t('backToSignIn')}</Link>
      </section>
    </main>
  )
}

export default ForgotPassword
