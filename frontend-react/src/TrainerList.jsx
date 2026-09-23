import { useState } from 'react'
import {
  Award,
  Mail,
  Phone,
  UserRound,
  Pencil,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function TrainerList({ trainers, onTrainerUpdated, onTrainerDeleted }) {
  const [editingId, setEditingId] = useState(null)

  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    email: '',
    certification: ''
  })

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  function startEditing(trainer) {
    setEditingId(trainer.trainer_id)

    setEditForm({
      name: trainer.name || '',
      phone: trainer.phone || '',
      email: trainer.email || '',
      certification: trainer.certification || ''
    })

    setError('')
  }

  function cancelEditing() {
    setEditingId(null)

    setEditForm({
      name: '',
      phone: '',
      email: '',
      certification: ''
    })

    setError('')
  }

  function handleEditChange(field, value) {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function handleUpdate(trainerId) {
    if (!editForm.name.trim()) {
      setError('Trainer name is required.')
      return
    }

    if (!editForm.phone.trim()) {
      setError('Phone is required.')
      return
    }

    if (!editForm.email.trim()) {
      setError('Email is required.')
      return
    }

    if (!editForm.certification.trim()) {
      setError('Certification is required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await authFetch(
        `${API_URL}/trainers/${trainerId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            name: editForm.name.trim(),
            phone: editForm.phone.trim(),
            email: editForm.email.trim(),
            certification: editForm.certification.trim()
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update trainer.')
      }

      setEditingId(null)

      if (onTrainerUpdated) {
        onTrainerUpdated()
      }
    } catch (err) {
      console.error('Failed to update trainer:', err)
      setError(err.message || 'Unable to update trainer.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(trainer) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${trainer.name}"?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(trainer.trainer_id)
    setError('')

    try {
      const response = await authFetch(
        `${API_URL}/trainers/${trainer.trainer_id}`,
        {
          method: 'DELETE'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete trainer.')
      }

      if (onTrainerDeleted) {
        onTrainerDeleted()
      }
    } catch (err) {
      console.error('Failed to delete trainer:', err)
      setError(err.message || 'Unable to delete trainer.')
    } finally {
      setDeletingId(null)
    }
  }

  if (trainers.length === 0) {
    return (
      <div className="trainer-state trainer-empty-state">
        <div className="trainer-state-icon">
          <UserRound size={25} />
        </div>

        <h3>No trainers yet</h3>
        <p>Add your first coach above to build your training team.</p>
      </div>
    )
  }

  return (
    <div className="trainer-list">

      {error && (
        <div className="trainer-feedback">
          <span>{error}</span>
        </div>
      )}

      {trainers.map(trainer => (
        <article
          className="trainer-card"
          key={trainer.trainer_id}
        >
          <div className="trainer-card-avatar">
            <UserRound size={22} />
          </div>

          <div className="trainer-card-main">

            {editingId === trainer.trainer_id ? (

              <div>
                <div className="trainer-card-title-row">
                  <div>
                    <span className="trainer-card-label">
                      Editing Trainer #{trainer.trainer_id}
                    </span>

                    <h2>Edit Trainer</h2>
                  </div>
                </div>

                <div className="trainer-form-grid">

                  <label className="trainer-field">
                    <span>Full name</span>

                    <div className="trainer-input-wrap">
                      <UserRound size={16} />

                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e =>
                          handleEditChange('name', e.target.value)
                        }
                        disabled={saving}
                      />
                    </div>
                  </label>

                  <label className="trainer-field">
                    <span>Phone</span>

                    <div className="trainer-input-wrap">
                      <Phone size={16} />

                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={e =>
                          handleEditChange('phone', e.target.value)
                        }
                        disabled={saving}
                      />
                    </div>
                  </label>

                  <label className="trainer-field">
                    <span>Email</span>

                    <div className="trainer-input-wrap">
                      <Mail size={16} />

                      <input
                        type="email"
                        value={editForm.email}
                        onChange={e =>
                          handleEditChange('email', e.target.value)
                        }
                        disabled={saving}
                      />
                    </div>
                  </label>

                  <label className="trainer-field">
                    <span>Certification</span>

                    <div className="trainer-input-wrap">
                      <Award size={16} />

                      <input
                        type="text"
                        value={editForm.certification}
                        onChange={e =>
                          handleEditChange(
                            'certification',
                            e.target.value
                          )
                        }
                        disabled={saving}
                      />
                    </div>
                  </label>

                </div>

                <div className="trainer-form-actions">

                  <button
                    type="button"
                    className="trainer-primary-button"
                    onClick={() =>
                      handleUpdate(trainer.trainer_id)
                    }
                    disabled={saving}
                  >
                    <Save size={16} />

                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    className="trainer-secondary-button"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    <X size={16} />
                    Cancel
                  </button>

                </div>
              </div>

            ) : (

              <>
                <div className="trainer-card-title-row">

                  <div>
                    <span className="trainer-card-label">
                      Trainer #{trainer.trainer_id}
                    </span>

                    <h2>{trainer.name}</h2>
                  </div>

                </div>

                <div className="trainer-card-details">

                  <span>
                    <Phone size={15} />
                    {trainer.phone}
                  </span>

                  <span>
                    <Mail size={15} />
                    {trainer.email}
                  </span>

                  <span>
                    <Award size={15} />
                    {trainer.certification}
                  </span>

                </div>

                <div className="trainer-card-actions">

                  <button
                    type="button"
                    className="trainer-secondary-button"
                    onClick={() => startEditing(trainer)}
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="trainer-danger-button"
                    onClick={() => handleDelete(trainer)}
                    disabled={
                      deletingId === trainer.trainer_id
                    }
                  >
                    <Trash2 size={15} />

                    {deletingId === trainer.trainer_id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>

                </div>
              </>

            )}

          </div>
        </article>
      ))}
    </div>
  )
}

export default TrainerList