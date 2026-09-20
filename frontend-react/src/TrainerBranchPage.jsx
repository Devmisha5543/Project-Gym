import { useState, useEffect } from 'react'
import { API_URL } from './config'
import TrainerBranchList from './TrainerBranchList'
import TrainerBranchForm from './TrainerBranchForm'
import { GitBranch, Receipt } from 'lucide-react'

function TrainerBranchPage() {
  const [trainerBranches, setTrainerBranches] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadTrainerBranches() {
    setLoading(true); setPageError('')
    fetch(`${API_URL}/trainerbranch`)
      .then(response => { if (!response.ok) throw new Error(`Trainer branches request failed: ${response.status}`); return response.json() })
      .then(data => setTrainerBranches(data))
      .catch(error => { console.error('Failed to load trainer branches:', error); setTrainerBranches([]); setPageError('Unable to load trainer branches. Please try again.') })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadTrainerBranches, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container trainer-branch-page"><div className="page-header"><div><p className="page-eyebrow">GYM MANAGEMENT</p><h1>Trainer Branch</h1><p className="page-description">Connect trainers to the branches where they coach.</p></div><div className="trainer-branch-total"><GitBranch size={19} /><span>{trainerBranches.length}</span><small>Total Links</small></div></div>
      <TrainerBranchForm onTrainerBranchCreated={loadTrainerBranches} />
      {pageError && <div className="trainer-branch-feedback"><Receipt size={17} /><span>{pageError}</span></div>}
      {loading ? <div className="trainer-branch-state"><div className="loading-spinner"></div><h3>Loading relationships</h3><p>Getting trainer locations ready.</p></div> : <TrainerBranchList trainerBranches={trainerBranches} onTrainerBranchDeleted={loadTrainerBranches} />}
    </div>
  )
}

export default TrainerBranchPage
