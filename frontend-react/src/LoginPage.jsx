import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()

  function handleSubmit(event) {
    event.preventDefault()

    fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    })
      .then(response => response.json().then(data => ({ status: response.status, data })))
      .then(({ status, data }) => {
        if (status !== 200) {
          setError(data.error || "Login failed")
          return
        }
        localStorage.setItem("token", data.token)
        localStorage.setItem("adminName", data.name)
        navigate("/dashboard")
      })
  }

  return (
    <div className="card" style={{ maxWidth: '400px', margin: '80px auto' }}>
      <h1>Admin Login</h1>
      <form onSubmit={handleSubmit}>
        <label>Email:</label>
        <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
        <br /><br />

        <label>Password:</label>
        <input type="password" value={password} onChange={e => setPassword(e.target.value)} required />
        <br /><br />

        {error && <p style={{ color: '#dc2626' }}>{error}</p>}

        <button type="submit">Log In</button>
      </form>
    </div>
  )
}

export default LoginPage