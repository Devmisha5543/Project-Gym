import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Activity, CalendarDays, Dumbbell, UserRound, Pencil, Trash2, Save, X } from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function PersonalTrainingAssignmentList({ personalTrainingAssignments, onAssignmentUpdated, onAssignmentDeleted }) {
  const { t } = useTranslation(['people', 'common'])
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
      if (!response.ok) throw new Error(data.error || t('assignmentUpdateFailed'))
      setEditingId(null)
      onAssignmentUpdated()
    } catch (err) {
      setError(err.message || t('assignmentUpdateFailed'))
    } finally {
      setBusyId(null)
    }
  }

  async function handleDelete(assignment) {
    if (!window.confirm(t('deleteAssignmentConfirm', { id: assignment.assignment_id }))) return
    setBusyId(assignment.assignment_id)
    setError('')
    try {
      const response = await authFetch(`${API_URL}/personaltrainingassignments/${assignment.assignment_id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || t('assignmentDeleteFailed'))
      onAssignmentDeleted()
    } catch (err) {
      setError(err.message || t('assignmentDeleteFailed'))
    } finally {
      setBusyId(null)
    }
  }

  if (personalTrainingAssignments.length === 0) {
    return (
      <div className="pt-assignment-state pt-assignment-empty-state">
        <div className="pt-assignment-state-icon"><Activity size={25} /></div>
        <h3>{t('noAssignments')}</h3>
        <p>{t('createAssignment')}</p>
      </div>
    )
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
                <div>
                  <span className="pt-assignment-card-label">{t('assignmentLabel', { id: assignment.assignment_id })}</span>
                  <h2>{assignment.speciality}</h2>
                </div>
                <span className={`pt-assignment-status pt-assignment-status-${String(assignment.status || 'unknown').toLowerCase()}`}>
                  {assignment.status || t('statusUnavailable')}
                </span>
              </div>
              <div className="pt-assignment-card-meta">
                <span><Dumbbell size={15} />{t('trainerItem', { id: assignment.trainer_id })}</span>
                <span><UserRound size={15} />{t('memberItem', { id: assignment.member_id })}</span>
                <span><CalendarDays size={15} />{t('startsDate', { date: assignment.start_date })}</span>
              </div>
              {editingId === assignment.assignment_id ? (
                <div className="equipment-card-actions">
                  <input aria-label={t('speciality')} value={editForm.speciality} onChange={e => setEditForm({ ...editForm, speciality: e.target.value })} required />
                  <input aria-label={t('startDate')} type="date" value={editForm.start_date} onChange={e => setEditForm({ ...editForm, start_date: e.target.value })} required />
                  <select aria-label={t('selectStatus')} value={editForm.status} onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                    <option value="active">{t('active')}</option>
                    <option value="paused">{t('paused')}</option>
                    <option value="completed">{t('completed')}</option>
                    <option value="cancelled">{t('cancelled')}</option>
                  </select>
                  <button type="button" className="equipment-primary-button" onClick={() => handleUpdate(assignment)} disabled={busyId === assignment.assignment_id}>
                    <Save size={15} />{t('save', { ns: 'common' })}
                  </button>
                  <button type="button" className="equipment-secondary-button" onClick={() => setEditingId(null)} disabled={busyId === assignment.assignment_id}>
                    <X size={15} />{t('cancel', { ns: 'common' })}
                  </button>
                </div>
              ) : (
                <div className="equipment-card-actions">
                  <button type="button" className="equipment-secondary-button" onClick={() => startEditing(assignment)}>
                    <Pencil size={15} />{t('edit', { ns: 'common' })}
                  </button>
                  <button type="button" className="equipment-danger-button" onClick={() => handleDelete(assignment)} disabled={busyId === assignment.assignment_id}>
                    <Trash2 size={15} />{busyId === assignment.assignment_id ? t('deleting', { ns: 'common' }) : t('delete', { ns: 'common' })}
                  </button>
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
