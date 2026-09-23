import { useState, useEffect } from 'react'
import { API_URL } from './config'
import BranchList from './BranchList'
import BranchForm from './BranchForm'
import { Building2, MapPinned } from 'lucide-react'

function BranchPage() {
  const [branches, setBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadBranches() {
    setLoading(true)
    setPageError('')

    fetch(`${API_URL}/branches`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Branches request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setBranches(data))
      .catch(error => {
        console.error('Failed to load branches:', error)
        setBranches([])
        setPageError('Unable to load branches. Please try again.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadBranches, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container branches-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">GYM MANAGEMENT</p>
          <h1>Branches</h1>
          <p className="page-description">
            Manage the locations that make up your gym network.
          </p>
        </div>

        <div className="branch-total">
          <Building2 size={19} />
          <span>{branches.length}</span>
          <small>Total Branches</small>
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
          <h3>Loading branches</h3>
          <p>Getting your gym locations ready.</p>
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

    
