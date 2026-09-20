import { useState, useEffect } from 'react'
import { personalTrainingAssignmentSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { Activity, CalendarDays, Check, Dumbbell, UserRound, Users } from 'lucide-react'

function PersonalTrainingAssignmentForm({ onPersonalTrainingAssignmentCreated }) {
  const [trainers, setTrainers] = useState([])
  const [members, setMembers] = useState([])
  const [trainerId, setTrainerId] = useState('')
  const [memberId, setMemberId] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [startDate, setStartDate] = useState('')
  const [status, setStatus] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetch(`${API_URL}/trainers`)
      .then(response => response.json())
      .then(data => setTrainers(data))

    fetch(`${API_URL}/members`)
      .then(response => response.json())
      .then(data => setMembers(data))
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
      .then(response => response.json())
      .then(() => {
        setTrainerId('')
        setMemberId('')
        setSpeciality('')
        setStartDate('')
        setStatus('')
        onPersonalTrainingAssignmentCreated()
      })
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

        <div className="pt-assignment-form-actions">
          <button type="submit" className="pt-assignment-primary-button">
            <Check size={16} /> Add Assignment
          </button>
        </div>
      </form>
    </section>
  )
}

export default PersonalTrainingAssignmentForm
