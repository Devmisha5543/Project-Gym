import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { API_URL } from './config'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import GoogleAuthButton from './GoogleAuthButton'

function LoginPage() {
  const { t } = useTranslation('auth')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)

    fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(response => response.json().then(data => ({ status: response.status, data })))
      .then(({ status, data }) => {
        if (status !== 200) {
          setError(status === 401 ? t('invalidCredentials') : t('loginFailed'))
          setIsSubmitting(false)
          return
        }
        localStorage.setItem("token", data.token)
        localStorage.setItem("adminName", data.name)
        navigate("/dashboard")
      })
      .catch(() => {
        setError(t('common:networkError'))
        setIsSubmitting(false)
      })
  }

  return (
    <main className="login-page"><div className="login-orbit login-orbit-one"></div><div className="login-orbit login-orbit-two"></div><section className="login-card"><div className="login-brand"><div className="login-brand-mark">PG</div><div><strong>Project Gym</strong><span>{t('managementPlatform', { defaultValue: 'Management platform' })}</span></div></div><div className="login-heading"><ShieldCheck size={20} /><span>{t('secureAdminAccess')}</span><h1>{t('welcomeBack')}</h1><p>{t('loginDescription')}</p></div><form className="login-form" onSubmit={handleSubmit}><label className="login-field"><span>{t('emailAddress')}</span><div className="login-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></div></label><label className="login-field"><span>{t('password')}</span><div className="login-input-wrap"><LockKeyhole size={17} /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder={t('enterPassword')} /></div></label><div style={{ textAlign: 'right', marginTop: -9 }}><Link to="/forgot-password" style={{ color: '#c48bff', fontSize: 12, textDecoration: 'none' }}>{t('forgotPassword')}</Link></div>{error && <div className="login-error" role="alert"><ShieldCheck size={16} />{error}</div>}<button className="login-button" type="submit" disabled={isSubmitting}>{isSubmitting ? t('signingIn') : <>{t('signIn')} <ArrowRight size={16} /></>}</button></form><div className="login-divider"><span>{t('or')}</span></div><GoogleAuthButton /></section></main>
  )
}

export default LoginPage
