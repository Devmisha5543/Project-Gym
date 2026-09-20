import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from './config'
import { ArrowRight, LockKeyhole, Mail, ShieldCheck } from 'lucide-react'

function LoginPage() {
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
          setError(data.error || "Login failed")
          setIsSubmitting(false)
          return
        }
        localStorage.setItem("token", data.token)
        localStorage.setItem("adminName", data.name)
        navigate("/dashboard")
      })
      .catch(() => {
        setError("Unable to connect to the server. Please try again.")
        setIsSubmitting(false)
      })
  }

  return (
    <main className="login-page"><div className="login-orbit login-orbit-one"></div><div className="login-orbit login-orbit-two"></div><section className="login-card"><div className="login-brand"><div className="login-brand-mark">PG</div><div><strong>Project Gym</strong><span>Management platform</span></div></div><div className="login-heading"><ShieldCheck size={20} /><span>SECURE ADMIN ACCESS</span><h1>Welcome back</h1><p>Sign in to manage your gym operations.</p></div><form className="login-form" onSubmit={handleSubmit}><label className="login-field"><span>Email address</span><div className="login-input-wrap"><Mail size={17} /><input type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" placeholder="you@example.com" /></div></label><label className="login-field"><span>Password</span><div className="login-input-wrap"><LockKeyhole size={17} /><input type="password" value={password} onChange={e => setPassword(e.target.value)} required autoComplete="current-password" placeholder="Enter your password" /></div></label>{error && <div className="login-error"><ShieldCheck size={16} />{error}</div>}<button className="login-button" type="submit" disabled={isSubmitting}>{isSubmitting ? "Signing you in..." : <>Sign in <ArrowRight size={16} /></>}</button></form></section></main>
  )
}

export default LoginPage