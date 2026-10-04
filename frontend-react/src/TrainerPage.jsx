import { authFetch } from './authFetch'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import TrainerList from './TrainerList'
import TrainerForm from './TrainerForm'
import { Award, Users } from 'lucide-react'

function TrainerPage() {
  const { t } = useTranslation(['people', 'common'])
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadTrainers = useCallback(() => {
    setLoading(true)
    setPageError('')

    authFetch(`${API_URL}/trainers`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Trainers request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setTrainers(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load trainers:', error)
        setTrainers([])
        setPageError(t('trainerLoadFailed', { defaultValue: 'Unable to load trainers. Please try again.' }))
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadTrainers, 0)
    return () => clearTimeout(loadTimer)
  }, [loadTrainers])

  return (
    <div className="page-container trainers-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{t('eyebrow')}</p>
          <h1>{t('trainersTitle')}</h1>
          <p className="page-description">
            {t('trainersDescription')}
          </p>
        </div>

        <div className="trainer-total">
          <Users size={19} />
          <span>{trainers.length}</span>
          <small>{t('totalTrainers')}</small>
        </div>
      </div>

      <TrainerForm onTrainerCreated={loadTrainers} />

      {pageError && (
        <div className="trainer-feedback">
          <Award size={17} />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (
        <div className="trainer-state">
          <div className="loading-spinner"></div>
          <h3>{t('loadingTrainersShort')}</h3>
          <p>{t('gettingTrainersReady')}</p>
        </div>
      ) : (
        <TrainerList
          trainers={trainers}
          onTrainerUpdated={loadTrainers}
          onTrainerDeleted={loadTrainers}
       />
      )}
    </div>
  )
}

export default TrainerPage
