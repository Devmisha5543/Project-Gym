import { useState, useEffect } from 'react'
import { personalTrainingAssignmentSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { Activity, CalendarDays, Check, Dumbbell, UserRound, Users } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function PersonalTrainingAssignmentForm({ onPersonalTrainingAssignmentCreated }) {
  const [trainers, setTrainers] = useState([])
  const [members, setMembers] = useState([])
  const [trainerId, setTrainerId] = useState('')
  const [memberId, setMemberId] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [startDate, setStartDate] = useState('')
  const [status, setStatus] = useState('')
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
        .catch(() => setLookupError('Unable to load trainers or members. Please try again.')),
      authFetch(`${API_URL}/members`)
        .then(response => {
          if (!response.ok) throw new Error('Failed to load members')
          return response.json()
        })
        .then(setMembers)
        .catch(() => setLookupError('Unable to load trainers or members. Please try again.'))
    ]).finally(() => setLoadingOptions(false))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const result = personalTrainingAssignmentSchema.safeParse({ trainerId, memberId, startDate })
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

    const newAssignment = {
      trainer_id: trainerId,
      member_id: memberId,
      speciality,
      start_date: startDate,
      status
    }

    authFetch(`${API_URL}/personaltrainingassignments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newAssignment)
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Unable to create personal training assignment.')
        return data
      })
      .then(() => {
        setTrainerId('')
        setMemberId('')
        setSpeciality('')
        setStartDate('')
        setStatus('')
        onPersonalTrainingAssignmentCreated()
      })
      .then(() => setFeedback({ type: 'success', message: 'Personal training assignment created successfully.' }))
      .catch(error => setFeedback({ type: 'error', message: error.message || 'Unable to create personal training assignment.' }))
      .finally(() => setSubmitting(false))
  }

  return (
    <section className="pt-assignment-form-section">
      <div className="pt-assignment-form-heading">
        <div className="pt-assignment-form-icon">
          <Activity size={19} />
        </div>
        <div>
          <h2>Assign Personal Training</h2>
          <p>Pair a member with a trainer and define the coaching engagement.</p>
        </div>
      </div>

      <form className="pt-assignment-form" onSubmit={handleSubmit}>
        <FeedbackMessage message={lookupError} />
        <div className="pt-assignment-form-grid">
          <label className="pt-assignment-field">
            <span>Trainer</span>
            <div className="pt-assignment-input-wrap">
              <Dumbbell size={16} />
              <select value={trainerId} onChange={e => setTrainerId(e.target.value)} required>
                <option value="">Select a trainer</option>
                {trainers.map(trainer => (
                  <option key={trainer.trainer_id} value={trainer.trainer_id}>{trainer.name}</option>
                ))}
              </select>
            </div>
            {errors.trainerId && <small className="pt-assignment-field-error">{errors.trainerId}</small>}
          </label>

          <label className="pt-assignment-field">
            <span>Member</span>
            <div className="pt-assignment-input-wrap">
              <UserRound size={16} />
              <select value={memberId} onChange={e => setMemberId(e.target.value)} required>
                <option value="">Select a member</option>
                {members.map(member => (
                  <option key={member.member_id} value={member.member_id}>{member.name}</option>
                ))}
              </select>
            </div>
            {errors.memberId && <small className="pt-assignment-field-error">{errors.memberId}</small>}
          </label>

          <label className="pt-assignment-field">
            <span>Speciality</span>
            <div className="pt-assignment-input-wrap">
              <Users size={16} />
              <input type="text" value={speciality} onChange={e => setSpeciality(e.target.value)} required placeholder="e.g. Strength training" />
            </div>
          </label>

          <label className="pt-assignment-field">
            <span>Start date</span>
            <div className="pt-assignment-input-wrap">
              <CalendarDays size={16} />
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
            </div>
            {errors.startDate && <small className="pt-assignment-field-error">{errors.startDate}</small>}
          </label>

          <label className="pt-assignment-field">
            <span>Status</span>
            <div className="pt-assignment-input-wrap">
              <Activity size={16} />
              <select value={status} onChange={e => setStatus(e.target.value)} required>
                <option value="">Select status</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </label>
        </div>

        <FeedbackMessage message={feedback?.message} type={feedback?.type} />
        <div className="pt-assignment-form-actions">
          <button type="submit" className="pt-assignment-primary-button" disabled={submitting || loadingOptions}>
            <Check size={16} /> {submitting ? 'Creating...' : loadingOptions ? 'Loading options...' : 'Add Assignment'}
          </button>
        </div>
      </form>
    </section>
  )
}

export default PersonalTrainingAssignmentForm
