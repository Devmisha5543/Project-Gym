import { authFetch } from './authFetch'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import PersonalTrainingAssignmentList from './PersonalTrainingAssignmentList'
import PersonalTrainingAssignmentForm from './PersonalTrainingAssignmentForm'
import { Activity, Receipt } from 'lucide-react'

function PersonalTrainingAssignmentPage() {
  const { t } = useTranslation(['people', 'common'])
  const [personalTrainingAssignments, setPersonalTrainingAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadPersonalTrainingAssignments = useCallback(() => {
    setLoading(true)
    setPageError('')

    authFetch(`${API_URL}/personaltrainingassignments`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Assignments request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setPersonalTrainingAssignments(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load personal training assignments:', error)
        setPersonalTrainingAssignments([])
        setPageError(t('assignmentLoadFailed'))
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadPersonalTrainingAssignments, 0)
    return () => clearTimeout(loadTimer)
  }, [loadPersonalTrainingAssignments])

  return (
    <div className="page-container pt-assignments-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{t('eyebrow')}</p>
          <h1>{t('personalTraining')}</h1>
          <p className="page-description">
            {t('personalTrainingDescription')}
          </p>
        </div>

        <div className="pt-assignment-total">
          <Activity size={19} />
          <span>{personalTrainingAssignments.length}</span>
          <small>{t('totalAssignments')}</small>
        </div>
      </div>

      <PersonalTrainingAssignmentForm onPersonalTrainingAssignmentCreated={loadPersonalTrainingAssignments} />

      {pageError && (
        <div className="pt-assignment-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (
        <div className="pt-assignment-state">
          <div className="loading-spinner"></div>
          <h3>{t('loadingAssignments')}</h3>
          <p>{t('gettingScheduleReady')}</p>
        </div>
      ) : (
        <PersonalTrainingAssignmentList
          personalTrainingAssignments={personalTrainingAssignments}
          onAssignmentUpdated={loadPersonalTrainingAssignments}
          onAssignmentDeleted={loadPersonalTrainingAssignments}
        />
      )}
    </div>
  )
}

export default PersonalTrainingAssignmentPage
