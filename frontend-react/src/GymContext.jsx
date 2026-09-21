import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

const GymContext = createContext(null)

export function GymProvider({ children }) {
  const [gym, setGym] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchGym = useCallback(async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      setGym(null)
      setLoading(false)
      return null
    }

    try {
      setLoading(true)
      setError(null)
      const res = await authFetch(`${API_URL}/gym`)
      if (res.status === 401) {
        localStorage.removeItem('token')
        window.location.href = '/login'
        return null
      }
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}))
        throw new Error(errData.error || `Failed to fetch gym profile: ${res.status}`)
      }
      const data = await res.json()
      setGym(data)
      return data
    } catch (err) {
      console.error('GymContext error:', err)
      setError(err.message || 'Unable to load gym organization details.')
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchGym()
  }, [fetchGym])

  const updateGym = useCallback((updatedGymData) => {
    setGym(prev => ({
      ...prev,
      ...updatedGymData
    }))
  }, [])

  return (
    <GymContext.Provider value={{ gym, loading, error, refreshGym: fetchGym, updateGym }}>
      {children}
    </GymContext.Provider>
  )
}

export function useGym() {
  const context = useContext(GymContext)
  if (!context) {
    throw new Error('useGym must be used within a GymProvider')
  }
  return context
}

export function GymBrandMark({ logoUrl, name, className = '' }) {
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [logoUrl])

  const initials = name
    ? name
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(w => w[0].toUpperCase())
        .join('') || 'PG'
    : 'PG'

  const showImage = Boolean(logoUrl && !imgError)

  return (
    <div
      className={`brand-mark ${className}`}
      style={showImage ? { padding: 0, overflow: 'hidden', background: '#1c1c1c' } : undefined}
    >
      {showImage ? (
        <img
          src={logoUrl}
          alt={name || 'Gym Logo'}
          style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 'inherit' }}
          onError={() => setImgError(true)}
        />
      ) : (
        initials
      )}
    </div>
  )
}
