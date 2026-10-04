import { useState } from 'react'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { GitBranch, MapPin, Trash2, UserRound, Pencil, Save, X } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function TrainerBranchList({ trainerBranches, onTrainerBranchUpdated, onTrainerBranchDeleted }) {
  const [error, setError] = useState('')
  const [busyKey, setBusyKey] = useState('')
  const [editingKey, setEditingKey] = useState('')
  const [editForm, setEditForm] = useState({ trainer_id: '', branch_id: '' })
  const [trainers, setTrainers] = useState([])
  const [branches, setBranches] = useState([])

  async function startEditing(assignment) {
    setError('')
    setBusyKey('options')
    try {
      const [trainerResponse, branchResponse] = await Promise.all([
        authFetch(`${API_URL}/trainers`),
        authFetch(`${API_URL}/branches`)
      ])
      if (!trainerResponse.ok || !branchResponse.ok) throw new Error('Unable to load trainers and branches.')
      const [trainerData, branchData] = await Promise.all([trainerResponse.json(), branchResponse.json()])
      setTrainers(trainerData)
      setBranches(branchData)
      setEditingKey(`${assignment.trainer_id}-${assignment.branch_id}`)
      setEditForm({ trainer_id: String(assignment.trainer_id), branch_id: String(assignment.branch_id) })
    } catch (editError) {
      setError(editError.message || 'Unable to edit trainer branch link.')
    } finally {
      setBusyKey('')
    }
  }

  async function handleUpdate(assignment) {
    const key = `${assignment.trainer_id}-${assignment.branch_id}`
    setBusyKey(key)
    setError('')
    try {
      const response = await authFetch(`${API_URL}/trainerbranch/${assignment.trainer_id}/${assignment.branch_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Unable to update trainer branch link.')
      setEditingKey('')
      onTrainerBranchUpdated()
    } catch (updateError) {
      setError(updateError.message || 'Unable to update trainer branch link.')
    } finally {
      setBusyKey('')
    }
  }

  async function handleDelete(assignment) {
    const key = `${assignment.trainer_id}-${assignment.branch_id}`
    setBusyKey(key)
    setError('')
    try {
      const response = await authFetch(`${API_URL}/trainerbranch/${assignment.trainer_id}/${assignment.branch_id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Unable to delete trainer branch link.')
      onTrainerBranchDeleted()
    } catch (deleteError) {
      setError(deleteError.message || 'Unable to delete trainer branch link.')
    } finally {
      setBusyKey('')
    }
  }

  if (trainerBranches.length === 0) return <><FeedbackMessage message={error} /><div className="trainer-branch-state"><div className="trainer-branch-state-icon"><GitBranch size={25} /></div><h3>No trainer branch links</h3><p>Create a relationship above to connect a trainer and branch.</p></div></>

  return (
    <div className="trainer-branch-list">
      <FeedbackMessage message={error} />
      {trainerBranches.map(assignment => {
        const key = `${assignment.trainer_id}-${assignment.branch_id}`
        return (
          <article className="trainer-branch-card" key={key}>
            <div className="trainer-branch-card-icon"><GitBranch size={20} /></div>
            <div className="trainer-branch-card-main">
              <span className="trainer-branch-card-label">Trainer Branch Link</span>
              {editingKey === key ? (
                <div className="equipment-card-actions">
                  <label>Trainer<select value={editForm.trainer_id} onChange={e => setEditForm({ ...editForm, trainer_id: e.target.value })}>{trainers.map(trainer => <option key={trainer.trainer_id} value={trainer.trainer_id}>{trainer.name}</option>)}</select></label>
                  <label>Branch<select value={editForm.branch_id} onChange={e => setEditForm({ ...editForm, branch_id: e.target.value })}>{branches.map(branch => <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>)}</select></label>
                  <button className="equipment-primary-button" type="button" onClick={() => handleUpdate(assignment)} disabled={Boolean(busyKey)}><Save size={15} />Save</button>
                  <button className="equipment-secondary-button" type="button" onClick={() => setEditingKey('')} disabled={Boolean(busyKey)}><X size={15} />Cancel</button>
                </div>
              ) : (
                <>
                  <h2>Trainer #{assignment.trainer_id}</h2>
                  <div className="trainer-branch-card-meta"><span><UserRound size={15} />Trainer #{assignment.trainer_id}</span><span><MapPin size={15} />Branch #{assignment.branch_id}</span></div>
                  <div className="equipment-card-actions">
                    <button className="equipment-secondary-button" type="button" onClick={() => startEditing(assignment)} disabled={Boolean(busyKey)}><Pencil size={15} />Edit</button>
                    <button className="trainer-branch-delete" type="button" onClick={() => handleDelete(assignment)} disabled={Boolean(busyKey)}><Trash2 size={16} /><span>{busyKey === key ? 'Deleting...' : 'Delete'}</span></button>
                  </div>
                </>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

export default TrainerBranchList
