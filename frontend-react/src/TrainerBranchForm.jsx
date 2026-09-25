import { useState, useEffect } from 'react'
import { trainerBranchSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { GitBranch, MapPin, Save, UserRound } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function TrainerBranchForm({ onTrainerBranchCreated }) {
  const [trainers, setTrainers] = useState([])
  const [branches, setBranches] = useState([])
  const [trainerId, setTrainerId] = useState('')
  const [branchId, setBranchId] = useState('')
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    Promise.all([
      authFetch(`${API_URL}/trainers`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load trainers')
          return response.json()
        })
        .then(setTrainers)
        .catch(() => setLookupError('Unable to load trainers or branches. Please try again.')),
      authFetch(`${API_URL}/branches`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load branches')
          return response.json()
        })
        .then(setBranches)
        .catch(() => setLookupError('Unable to load trainers or branches. Please try again.'))
    ]).finally(() => setLoadingOptions(false))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const result = trainerBranchSchema.safeParse({ trainerId, branchId })
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})
    setFeedback(null)
    setSubmitting(true)

    const newTrainerBranch = {
      trainer_id: trainerId,
      branch_id: branchId
    }

    authFetch(`${API_URL}/trainerbranch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTrainerBranch)
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Unable to create trainer branch link.')
        return data
      })
      .then(() => {
        setTrainerId('')
        setBranchId('')
        onTrainerBranchCreated()
      })
      .then(() => setFeedback({ type: 'success', message: 'Trainer branch link created successfully.' }))
      .catch(error => setFeedback({ type: 'error', message: error.message || 'Unable to create trainer branch link.' }))
      .finally(() => setSubmitting(false))
  }

  return (
    <section className="trainer-branch-form-section"><div className="trainer-branch-form-heading"><div className="trainer-branch-form-icon"><GitBranch size={19} /></div><div><h2>Link Trainer to Branch</h2><p>Define where a trainer is available to coach.</p></div></div><form className="trainer-branch-form" onSubmit={handleSubmit}><FeedbackMessage message={lookupError} /><div className="trainer-branch-form-grid"><label className="trainer-branch-field"><span>Trainer</span><div className="trainer-branch-input-wrap"><UserRound size={16} /><select value={trainerId} onChange={e => setTrainerId(e.target.value)} required>
        <option value="">-- Select a trainer --</option>
        {trainers.map(trainer => (
          <option key={trainer.trainer_id} value={trainer.trainer_id}>{trainer.name}</option>
        ))}
      </select></div>{errors.trainerId && <small className="trainer-branch-field-error">{errors.trainerId}</small>}</label><label className="trainer-branch-field"><span>Branch</span><div className="trainer-branch-input-wrap"><MapPin size={16} /><select value={branchId} onChange={e => setBranchId(e.target.value)} required>
        <option value="">-- Select a branch --</option>
        {branches.map(branch => (
          <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>
        ))}
      </select></div>{errors.branchId && <small className="trainer-branch-field-error">{errors.branchId}</small>}</label></div><FeedbackMessage message={feedback?.message} type={feedback?.type} /><div className="trainer-branch-form-actions"><button type="submit" className="trainer-branch-primary-button" disabled={submitting || loadingOptions}><Save size={16} /> {submitting ? 'Creating...' : loadingOptions ? 'Loading options...' : 'Add Link'}</button></div></form></section>
  )
}

export default TrainerBranchForm
