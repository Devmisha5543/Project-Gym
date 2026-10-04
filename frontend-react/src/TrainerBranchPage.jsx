import { authFetch } from './authFetch'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import TrainerBranchList from './TrainerBranchList'
import TrainerBranchForm from './TrainerBranchForm'
import { GitBranch, Receipt } from 'lucide-react'

function TrainerBranchPage() {
  const { t } = useTranslation(['people', 'common'])
  const [trainerBranches, setTrainerBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadTrainerBranches = useCallback(() => {
    setLoading(true)
    setPageError('')
    authFetch(`${API_URL}/trainerbranch`)
      .then(response => {
        if (!response.ok) throw new Error(`Trainer branches request failed: ${response.status}`)
        return response.json()
      })
      .then(data => setTrainerBranches(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load trainer branches:', error)
        setTrainerBranches([])
        setPageError(t('trainerBranchLinkLoadFailed'))
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadTrainerBranches, 0)
    return () => clearTimeout(loadTimer)
  }, [loadTrainerBranches])

  return (
    <div className="page-container trainer-branch-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{t('eyebrow')}</p>
          <h1>{t('trainerBranchTitle')}</h1>
          <p className="page-description">{t('trainerBranchDescription')}</p>
        </div>
        <div className="trainer-branch-total">
          <GitBranch size={19} />
          <span>{trainerBranches.length}</span>
          <small>{t('totalLinks')}</small>
        </div>
      </div>
      <TrainerBranchForm onTrainerBranchCreated={loadTrainerBranches} />
      {pageError && (
        <div className="trainer-branch-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}
      {loading ? (
        <div className="trainer-branch-state">
          <div className="loading-spinner"></div>
          <h3>{t('loadingRelationships')}</h3>
          <p>{t('gettingRelationshipsReady')}</p>
        </div>
      ) : (
        <TrainerBranchList
          trainerBranches={trainerBranches}
          onTrainerBranchUpdated={loadTrainerBranches}
          onTrainerBranchDeleted={loadTrainerBranches}
        />
      )}
    </div>
  )
}

export default TrainerBranchPage
