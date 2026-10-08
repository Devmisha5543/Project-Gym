import { useTranslation } from 'react-i18next'
import { API_URL } from './config'

function GoogleAuthButton() {
  const { t } = useTranslation('auth')

  return (
    <a className="google-auth-button" href={`${API_URL}/auth/google/start`}>
      <span className="google-auth-mark" aria-hidden="true">G</span>
      {t('continueWithGoogle')}
    </a>
  )
}

export default GoogleAuthButton
