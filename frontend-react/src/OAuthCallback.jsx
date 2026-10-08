import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

function OAuthCallback() {
  const { t } = useTranslation('auth')
  const navigate = useNavigate()
  const [error, setError] = useState('')

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    const name = params.get('name')
    const oauthError = params.get('error')

    window.history.replaceState({}, '', window.location.pathname)

    if (token) {
      localStorage.setItem('token', token)
      if (name) localStorage.setItem('adminName', name)
      navigate('/dashboard', { replace: true })
      return
    }

    // The callback URL is an external navigation result, so surface its error once.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setError(oauthError || 'googleSignInFailed')
  }, [navigate])

  return (
    <main className="login-page">
      <section className="login-card oauth-callback-card">
        {error ? (
          <>
            <div className="login-heading">
              <h1>{t('googleSignInFailed')}</h1>
              <p>{t(`oauthErrors.${error}`, { defaultValue: t('googleSignInFailedDescription') })}</p>
            </div>
            <button type="button" className="login-button" onClick={() => navigate('/login', { replace: true })}>
              {t('backToSignIn')}
            </button>
          </>
        ) : (
          <div className="oauth-callback-loading">
            <span className="oauth-spinner" />
            <p>{t('completingGoogleSignIn')}</p>
          </div>
        )}
      </section>
    </main>
  )
}

export default OAuthCallback
