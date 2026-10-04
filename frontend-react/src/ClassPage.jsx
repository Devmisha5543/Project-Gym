import { authFetch } from './authFetch'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import ClassList from './ClassList'
import ClassForm from './ClassForm'
import { CalendarDays, Receipt } from 'lucide-react'

function ClassPage() {
  const { t } = useTranslation(['classes', 'common'])
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadClasses = useCallback(() => {
    setLoading(true)
    setPageError('')

    authFetch(`${API_URL}/classes`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Classes request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setClasses(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load classes:', error)
        setClasses([])
        setPageError(t('classLoadFailed'))
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadClasses, 0)
    return () => clearTimeout(loadTimer)
  }, [loadClasses])

  return (
    <div className="page-container classes-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{t('eyebrow')}</p>
          <h1>{t('classesTitle')}</h1>
          <p className="page-description">
            {t('classesDescription')}
          </p>
        </div>

        <div className="class-total">
          <CalendarDays size={19} />
          <span>{classes.length}</span>
          <small>{t('totalClasses')}</small>
        </div>
      </div>

      <ClassForm onClassCreated={loadClasses} />

      {pageError && (
        <div className="class-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (
        <div className="class-state">
          <div className="loading-spinner"></div>
          <h3>{t('loadingClasses')}</h3>
          <p>{t('gettingClassesReady')}</p>
        </div>
      ) : (
        <ClassList 
          classes={classes}
          onClassUpdated={loadClasses}
          onClassDeleted={loadClasses} 
        />
      )}
    </div>
  )
}

export default ClassPage
