import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  CalendarDays,
  Clock3,
  Dumbbell,
  MapPin,
  Users,
  Pencil,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function ClassList({ classes, onClassUpdated, onClassDeleted }) {
  const { t } = useTranslation(['classes', 'common'])
  const [editingClass, setEditingClass] = useState(null)

  const [branches, setBranches] = useState([])
  const [trainers, setTrainers] = useState([])

  const [formData, setFormData] = useState({
    branch_id: '',
    trainer_id: '',
    class_name: '',
    schedule_time: '',
    duration_minutes: '',
    capacity: ''
  })

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [operationError, setOperationError] = useState('')

  useEffect(() => {
    authFetch(`${API_URL}/branches`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load branches')
        return response.json()
      })
      .then(data => setBranches(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load branches:', error)
      })

    authFetch(`${API_URL}/trainers`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load trainers')
        return response.json()
      })
      .then(data => setTrainers(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load trainers:', error)
      })
  }, [])

  function formatDateTimeForInput(value) {
    if (!value) return ''

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value).slice(0, 16)
    }

    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  function handleEdit(gymClass) {
    setOperationError('')
    setEditingClass(gymClass)

    setFormData({
      branch_id: gymClass.branch_id,
      trainer_id: gymClass.trainer_id,
      class_name: gymClass.class_name,
      schedule_time: formatDateTimeForInput(gymClass.schedule_time),
      duration_minutes: gymClass.duration_minutes,
      capacity: gymClass.capacity
    })
  }

  function handleChange(event) {
    const { name, value } = event.target

    setFormData(previous => ({
      ...previous,
      [name]: value
    }))
  }

  function cancelEdit() {
    setEditingClass(null)

    setFormData({
      branch_id: '',
      trainer_id: '',
      class_name: '',
      schedule_time: '',
      duration_minutes: '',
      capacity: ''
    })
  }

  function handleUpdate(event) {
    event.preventDefault()

    setSaving(true)
    setOperationError('')

    authFetch(`${API_URL}/classes/${editingClass.class_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || t('classUpdateFailed'))
        return data
      })
      .then(() => {
        cancelEdit()
        onClassUpdated()
      })
      .catch(error => {
        console.error('Failed to update class:', error)
        setOperationError(error.message || t('classUpdateFailed'))
      })
      .finally(() => {
        setSaving(false)
      })
  }

  function handleDelete(classId) {
    const confirmed = window.confirm(
      t('deleteClassConfirm')
    )

    if (!confirmed) return

    setDeletingId(classId)
    setOperationError('')

    authFetch(`${API_URL}/classes/${classId}`, {
      method: 'DELETE'
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || t('classDeleteFailed'))
        return data
      })
      .then(() => {
        onClassDeleted()
      })
      .catch(error => {
        console.error('Failed to delete class:', error)
        setOperationError(error.message || t('classDeleteFailed'))
      })
      .finally(() => {
        setDeletingId(null)
      })
  }

  if (classes.length === 0) {
    return (
      <div className="class-state class-empty-state">
        <div className="class-state-icon">
          <CalendarDays size={25} />
        </div>

        <h3>{t('noClasses')}</h3>
        <p>{t('noClassesDescription')}</p>
      </div>
    )
  }

  return (
    <>
      {operationError && (
        <div className="class-feedback" role="alert">
          {operationError}
        </div>
      )}

      <div className="class-list">
        {classes.map(gymClass => (
          <article className="class-card" key={gymClass.class_id}>
            <div className="class-card-icon">
              <Dumbbell size={20} />
            </div>

            <div className="class-card-main">
              <div className="class-card-title-row">
                <div>
                  <span className="class-card-label">
                    {t('classCardLabel', { id: gymClass.class_id })}
                  </span>

                  <h2>{gymClass.class_name}</h2>
                </div>
              </div>

              <div className="class-card-details">
                <span>
                  <CalendarDays size={15} />
                  {gymClass.schedule_time}
                </span>

                <span>
                  <Clock3 size={15} />
                  {t('minutesCount', { count: gymClass.duration_minutes })}
                </span>

                <span>
                  <Users size={15} />
                  {t('capacityCount', { count: gymClass.capacity })}
                </span>

                <span>
                  <Users size={15} />
                  {t('trainerItem', { id: gymClass.trainer_id })}
                </span>

                <span>
                  <MapPin size={15} />
                  {t('branchItem', { id: gymClass.branch_id })}
                </span>
              </div>

              <div className="class-card-actions">
                <button
                  type="button"
                  className="class-secondary-button"
                  onClick={() => handleEdit(gymClass)}
                >
                  <Pencil size={15} />
                  {t('edit', { ns: 'common' })}
                </button>

                <button
                  type="button"
                  className="class-danger-button"
                  onClick={() => handleDelete(gymClass.class_id)}
                  disabled={deletingId === gymClass.class_id}
                >
                  <Trash2 size={15} />

                  {deletingId === gymClass.class_id
                    ? t('deleting', { ns: 'common' })
                    : t('delete', { ns: 'common' })}
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      {editingClass && (
        <div className="class-edit-overlay">
          <div className="class-edit-modal">
            <div className="class-edit-header">
              <div>
                <span className="class-card-label">
                  {t('editingClass', { id: editingClass.class_id })}
                </span>

                <h2>{t('editClass')}</h2>
              </div>

              <button
                type="button"
                className="class-edit-close"
                onClick={cancelEdit}
              >
                <X size={19} />
              </button>
            </div>

            <form onSubmit={handleUpdate}>
              <div className="class-edit-grid">
                <label className="class-field">
                  <span>{t('className')}</span>

                  <div className="class-input-wrap">
                    <Dumbbell size={16} />

                    <input
                      type="text"
                      name="class_name"
                      value={formData.class_name}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>

                <label className="class-field">
                  <span>{t('branch', { ns: 'common' })}</span>

                  <div className="class-input-wrap">
                    <MapPin size={16} />

                    <select
                      name="branch_id"
                      value={formData.branch_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">{t('selectBranch', { ns: 'common' })}</option>

                      {branches.map(branch => (
                        <option
                          key={branch.branch_id}
                          value={branch.branch_id}
                        >
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="class-field">
                  <span>{t('trainer', { ns: 'common' })}</span>

                  <div className="class-input-wrap">
                    <Users size={16} />

                    <select
                      name="trainer_id"
                      value={formData.trainer_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">{t('selectTrainer', { ns: 'common' })}</option>

                      {trainers.map(trainer => (
                        <option
                          key={trainer.trainer_id}
                          value={trainer.trainer_id}
                        >
                          {trainer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </label>

                <label className="class-field">
                  <span>{t('scheduleTime')}</span>

                  <div className="class-input-wrap">
                    <CalendarDays size={16} />

                    <input
                      type="datetime-local"
                      name="schedule_time"
                      value={formData.schedule_time}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>

                <label className="class-field">
                  <span>{t('durationMinutes')}</span>

                  <div className="class-input-wrap">
                    <Clock3 size={16} />

                    <input
                      type="number"
                      name="duration_minutes"
                      value={formData.duration_minutes}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>

                <label className="class-field">
                  <span>{t('capacity')}</span>

                  <div className="class-input-wrap">
                    <Users size={16} />

                    <input
                      type="number"
                      name="capacity"
                      value={formData.capacity}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </label>
              </div>

              <div className="class-edit-actions">
                <button
                  type="button"
                  className="class-secondary-button"
                  onClick={cancelEdit}
                  disabled={saving}
                >
                  <X size={15} />
                  {t('cancel', { ns: 'common' })}
                </button>

                <button
                  type="submit"
                  className="class-primary-button"
                  disabled={saving}
                >
                  <Save size={15} />

                  {saving ? t('saving', { ns: 'common' }) : t('saveChanges', { ns: 'common' })}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}

export default ClassList
