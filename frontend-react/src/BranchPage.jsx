import { authFetch } from './authFetch'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import BranchList from './BranchList'
import BranchForm from './BranchForm'
import { Building2, MapPinned } from 'lucide-react'

function BranchPage() {
  const { t } = useTranslation(['people', 'common'])
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadBranches = useCallback(() => {
    setLoading(true)
    setPageError('')

    authFetch(`${API_URL}/branches`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Branches request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setBranches(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load branches:', error)
        setBranches([])
        setPageError(t('branchLoadFailed', { defaultValue: 'Unable to load branches. Please try again.' }))
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadBranches, 0)
    return () => clearTimeout(loadTimer)
  }, [loadBranches])

  return (
    <div className="page-container branches-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{t('eyebrow')}</p>
          <h1>{t('branchesTitle')}</h1>
          <p className="page-description">
            {t('branchesDescription')}
          </p>
        </div>

        <div className="branch-total">
          <Building2 size={19} />
          <span>{branches.length}</span>
          <small>{t('totalBranches')}</small>
        </div>
      </div>

      <BranchForm onBranchCreated={loadBranches} />

      {pageError && (
        <div className="branch-feedback branch-feedback-error">
          <MapPinned size={17} />
          <span>{pageError}</span>
        </div>
      )}
      {loading ? (
        <div className="branch-state">
          <div className="loading-spinner"></div>
          <h3>{t('loadingBranchesShort')}</h3>
          <p>{t('gettingBranchesReady')}</p>
        </div>
      ) : (
        <BranchList
          branches={branches}
          onBranchUpdated={loadBranches}
          onBranchDeleted={loadBranches}
        />
      )}
    </div>
  )
}

export default BranchPage
