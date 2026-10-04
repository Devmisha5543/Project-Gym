import { useState } from 'react'
import { Link } from 'react-router-dom'
import { API_URL } from './config'
import { ArrowLeft, Mail, ShieldCheck } from 'lucide-react'

function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setIsSubmitting(true)
    try {
      await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
    } catch {
      // Keep the response the same whether or not the address has an account.
    }
    setSubmitted(true)
    setIsSubmitting(false)
  }

  return (
    <main className="login-page">
      <div className="login-orbit login-orbit-one"></div>
      <div className="login-orbit login-orbit-two"></div>
      <section className="login-card">
        <div className="login-brand"><div className="login-brand-mark">PG</div><div><strong>Project Gym</strong><span>Management platform</span></div></div>
        <div className="login-heading"><ShieldCheck size={20} /><span>ACCOUNT RECOVERY</span><h1>Forgot password?</h1><p>Enter your email and we’ll send a reset link if an account matches.</p></div>
        {submitted ? (
          <div className="settings-feedback-success" role="status">If that email is registered, a reset link has been sent.</div>
        ) : (
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="login-field"><span>Email address</span><div className="login-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={event => setEmail(event.target.value)} required autoComplete="email" placeholder="you@example.com" /></div></label>
            <button className="login-button" type="submit" disabled={isSubmitting}>{isSubmitting ? 'Sending…' : 'Send reset link'}</button>
          </form>
        )}
        <Link to="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 18, color: '#c48bff', fontSize: 12, textDecoration: 'none' }}><ArrowLeft size={14} /> Back to sign in</Link>
      </section>
    </main>
  )
}

export default ForgotPassword
