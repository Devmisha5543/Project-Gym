import { useEffect, useState } from 'react'
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

  useEffect(() => {
    fetch(`${API_URL}/branches`)
      .then(response => response.json())
      .then(data => setBranches(data))
      .catch(error => {
        console.error('Failed to load branches:', error)
      })

    fetch(`${API_URL}/trainers`)
      .then(response => response.json())
      .then(data => setTrainers(data))
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

    authFetch(`${API_URL}/classes/${editingClass.class_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to update class')
        }

        return response.json()
      })
      .then(() => {
        cancelEdit()
        onClassUpdated()
      })
      .catch(error => {
        console.error('Failed to update class:', error)
        alert('Unable to update class. Please try again.')
      })
      .finally(() => {
        setSaving(false)
      })
  }

  function handleDelete(classId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this class?'
    )

    if (!confirmed) return

    setDeletingId(classId)

    authFetch(`${API_URL}/classes/${classId}`, {
      method: 'DELETE'
    })
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to delete class')
        }

        return response.json()
      })
      .then(() => {
        onClassDeleted()
      })
      .catch(error => {
        console.error('Failed to delete class:', error)
        alert('Unable to delete class. Please try again.')
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

        <h3>No classes scheduled</h3>
        <p>Create your first class above to build the schedule.</p>
      </div>
    )
  }

  return (
    <>
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
                    Class #{gymClass.class_id}
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
                  {gymClass.duration_minutes} minutes
                </span>

                <span>
                  <Users size={15} />
                  Capacity {gymClass.capacity}
                </span>

                <span>
                  <Users size={15} />
                  Trainer #{gymClass.trainer_id}
                </span>

                <span>
                  <MapPin size={15} />
                  Branch #{gymClass.branch_id}
                </span>
              </div>

              <div className="class-card-actions">
                <button
                  type="button"
                  className="class-secondary-button"
                  onClick={() => handleEdit(gymClass)}
                >
                  <Pencil size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  className="class-danger-button"
                  onClick={() => handleDelete(gymClass.class_id)}
                  disabled={deletingId === gymClass.class_id}
                >
                  <Trash2 size={15} />

                  {deletingId === gymClass.class_id
                    ? 'Deleting...'
                    : 'Delete'}
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
                  EDITING CLASS #{editingClass.class_id}
                </span>

                <h2>Edit Class</h2>
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
                  <span>Class name</span>

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
                  <span>Branch</span>

                  <div className="class-input-wrap">
                    <MapPin size={16} />

                    <select
                      name="branch_id"
                      value={formData.branch_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a branch</option>

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
                  <span>Trainer</span>

                  <div className="class-input-wrap">
                    <Users size={16} />

                    <select
                      name="trainer_id"
                      value={formData.trainer_id}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select a trainer</option>

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
                  <span>Schedule time</span>

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
                  <span>Duration in minutes</span>

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
                  <span>Capacity</span>

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
                  Cancel
                </button>

                <button
                  type="submit"
                  className="class-primary-button"
                  disabled={saving}
                >
                  <Save size={15} />

                  {saving ? 'Saving...' : 'Save Changes'}
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