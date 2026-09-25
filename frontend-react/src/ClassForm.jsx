import { useState, useEffect } from 'react'
import { classSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { CalendarDays, Clock3, Dumbbell, MapPin, Plus, Save, Users } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function ClassForm({ onClassCreated }) {
  const [branches, setBranches] = useState([])
  const [trainers, setTrainers] = useState([])
  const [branchId, setBranchId] = useState('')
  const [trainerId, setTrainerId] = useState('')
  const [className, setClassName] = useState('')
  const [scheduleTime, setScheduleTime] = useState('')
  const [durationMinutes, setDurationMinutes] = useState('')
  const [capacity, setCapacity] = useState('')
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [loadingOptions, setLoadingOptions] = useState(true)

  useEffect(() => {
    Promise.all([
      authFetch(`${API_URL}/branches`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load branches')
          return response.json()
        })
        .then(setBranches)
        .catch(() => setLookupError('Unable to load branches or trainers. Please try again.')),
      authFetch(`${API_URL}/trainers`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load trainers')
          return response.json()
        })
        .then(setTrainers)
        .catch(() => setLookupError('Unable to load branches or trainers. Please try again.'))
    ]).finally(() => setLoadingOptions(false))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const result = classSchema.safeParse({ branchId, trainerId, className, scheduleTime, durationMinutes, capacity })
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

    const newClass = {
      branch_id: branchId,
      trainer_id: trainerId,
      class_name: className,
      schedule_time: scheduleTime,
      duration_minutes: durationMinutes,
      capacity
    }

    authFetch(`${API_URL}/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClass)
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Unable to create class.')
        return data
      })
      .then(() => {
        setBranchId('')
        setTrainerId('')
        setClassName('')
        setScheduleTime('')
        setDurationMinutes('')
        setCapacity('')
        onClassCreated()
        setFeedback({ type: 'success', message: 'Class scheduled successfully.' })
      })
      .catch(error => setFeedback({ type: 'error', message: error.message || 'Unable to create class.' }))
      .finally(() => setSubmitting(false))
  }

  return (
    <section className="class-form-section">
      <div className="class-form-heading">
        <div className="class-form-icon">
          <Plus size={19} />
        </div>
        <div>
          <h2>Schedule New Class</h2>
          <p>Set up a class, instructor, time, and capacity.</p>
        </div>
      </div>

      <FeedbackMessage message={lookupError} />

      <form className="class-form" onSubmit={handleSubmit}>
        <div className="class-form-grid">
          <label className="class-field">
            <span>Class name</span>
            <div className="class-input-wrap">
              <Dumbbell size={16} />
              <input type="text" value={className} onChange={e => setClassName(e.target.value)} required placeholder="e.g. Strength & Conditioning" />
            </div>
            {errors.className && <small className="class-field-error">{errors.className}</small>}
          </label>

          <label className="class-field">
            <span>Branch</span>
            <div className="class-input-wrap">
              <MapPin size={16} />
              <select value={branchId} onChange={e => setBranchId(e.target.value)} required>
                <option value="">Select a branch</option>
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>
                ))}
              </select>
            </div>
            {errors.branchId && <small className="class-field-error">{errors.branchId}</small>}
          </label>

          <label className="class-field">
            <span>Trainer</span>
            <div className="class-input-wrap">
              <Users size={16} />
              <select value={trainerId} onChange={e => setTrainerId(e.target.value)} required>
                <option value="">Select a trainer</option>
                {trainers.map(trainer => (
                  <option key={trainer.trainer_id} value={trainer.trainer_id}>{trainer.name}</option>
                ))}
              </select>
            </div>
            {errors.trainerId && <small className="class-field-error">{errors.trainerId}</small>}
          </label>

          <label className="class-field">
            <span>Schedule time</span>
            <div className="class-input-wrap">
              <CalendarDays size={16} />
              <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} required />
            </div>
            {errors.scheduleTime && <small className="class-field-error">{errors.scheduleTime}</small>}
          </label>

          <label className="class-field">
            <span>Duration in minutes</span>
            <div className="class-input-wrap">
              <Clock3 size={16} />
              <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} required placeholder="60" />
            </div>
            {errors.durationMinutes && <small className="class-field-error">{errors.durationMinutes}</small>}
          </label>

          <label className="class-field">
            <span>Capacity</span>
            <div className="class-input-wrap">
              <Users size={16} />
              <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required placeholder="20" />
            </div>
            {errors.capacity && <small className="class-field-error">{errors.capacity}</small>}
          </label>
        </div>

        <FeedbackMessage message={feedback?.message} type={feedback?.type} />
        <div className="class-form-actions">
          <button type="submit" className="class-primary-button" disabled={submitting || loadingOptions}>
            <Save size={16} /> {submitting ? 'Creating...' : loadingOptions ? 'Loading options...' : 'Add Class'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default ClassForm
