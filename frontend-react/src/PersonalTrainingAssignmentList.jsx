import { useState } from 'react'
import { Activity, CalendarDays, Dumbbell, UserRound, Pencil, Trash2, Save, X } from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function PersonalTrainingAssignmentList({ personalTrainingAssignments, onAssignmentUpdated, onAssignmentDeleted }) {
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ speciality: '', start_date: '', status: '' })
  const [busyId, setBusyId] = useState(null)
  const [error, setError] = useState('')

  function startEditing(assignment) {
    setEditingId(assignment.assignment_id)
    setEditForm({
      speciality: assignment.speciality || '',
      start_date: String(assignment.start_date || '').slice(0, 10),
      status: assignment.status || 'active'
    })
    setError('')
  }

  async function handleUpdate(assignment) {
    setBusyId(assignment.assignment_id)
    setError('')
    try {
      const response = await authFetch(`${API_URL}/personaltrainingassignments/${assignment.assignment_id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainer_id: assignment.trainer_id,
          member_id: assignment.member_id,
          ...editForm
        })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to update assignment.')
      setEditingId(null)
      onAssignmentUpdated()
    } catch (err) {
      setError(err.message || 'Unable to update assignment.')
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(assignment) {
    if (!window.confirm(`Delete personal training assignment #${assignment.assignment_id}?`)) return
    setBusyId(assignment.assignment_id)
    setError('')
    try {
      const response = await authFetch(`${API_URL}/personaltrainingassignments/${assignment.assignment_id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || 'Failed to delete assignment.')
      onAssignmentDeleted()
    } catch (err) {
      setError(err.message || 'Unable to delete assignment.')
    } finally {
      setBusyId(null)
    }
  }

  if (personalTrainingAssignments.length === 0) {
    return <div className="pt-assignment-state pt-assignment-empty-state"><div className="pt-assignment-state-icon"><Activity size={25} /></div><h3>No personal training assignments</h3><p>Create an assignment above to connect a member with a trainer.</p></div>
  }

  return (
    <>
      {error && <div className="pt-assignment-feedback" role="alert">{error}</div>}
      <div className="pt-assignment-list">
        {personalTrainingAssignments.map(assignment => (
          <article className="pt-assignment-card" key={assignment.assignment_id}>
            <div className="pt-assignment-card-icon"><Activity size={20} /></div>
            <div className="pt-assignment-card-main">
              <div className="pt-assignment-card-title-row">
                <div><span className="pt-assignment-card-label">Assignment #{assignment.assignment_id}</span><h2>{assignment.speciality}</h2></div>
                <span className={`pt-assignment-status pt-assignment-status-${String(assignment.status || 'unknown').toLowerCase()}`}>{assignment.status || 'Status unavailable'}</span>
              </div>
              <div className="pt-assignment-card-meta">
                <span><Dumbbell size={15} />Trainer #{assignment.trainer_id}</span>
                <span><UserRound size={15} />Member #{assignment.member_id}</span>
                <span><CalendarDays size={15} />Starts {assignment.start_date}</span>
              </div>
              {editingId === assignment.assignment_id ? (
                <div className="equipment-card-actions">
                  <input aria-label="Speciality" value={editForm.speciality} onChange={e => setEditForm({ ...editForm, speciality: e.target.value })} required />
                  <input aria-label="Start date" type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} required />
                  <select aria-label="Status" value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}><option value="active">Active</option><option value="paused">Paused</option><option value="completed">Completed</option><option value="cancelled">Cancelled</option></select>
                  <button type="button" className="equipment-primary-button" onClick={() => handleUpdate(assignment)} disabled={busyId === assignment.assignment_id}><Save size={15} />Save</button>
                  <button type="button" className="equipment-secondary-button" onClick={() => setEditingId(null)} disabled={busyId === assignment.assignment_id}><X size={15} />Cancel</button>
                </div>
              ) : (
                <div className="equipment-card-actions">
                  <button type="button" className="equipment-secondary-button" onClick={() => startEditing(assignment)}><Pencil size={15} />Edit</button>
                  <button type="button" className="equipment-danger-button" onClick={() => handleDelete(assignment)} disabled={busyId === assignment.assignment_id}><Trash2 size={15} />{busyId === assignment.assignment_id ? 'Deleting...' : 'Delete'}</button>
                </div>
              )}
            </div>
          </article>
        ))}
      </div>
    </>
  )
}

export default PersonalTrainingAssignmentList
