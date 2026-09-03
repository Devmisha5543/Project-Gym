import { useState, useEffect } from 'react'
import { classSchema } from './schemas'
import { API_URL } from './config'

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

  useEffect(() => {
    fetch(`${API_URL}/branches`)
      .then(response => response.json())
      .then(data => setBranches(data))

    fetch(`${API_URL}/trainers`)
      .then(response => response.json())
      .then(data => setTrainers(data))
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

    const newClass = {
      branch_id: branchId,
      trainer_id: trainerId,
      class_name: className,
      schedule_time: scheduleTime,
      duration_minutes: durationMinutes,
      capacity
    }

    fetch(`${API_URL}/classes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newClass)
    })
      .then(response => response.json())
      .then(() => {
        setBranchId('')
        setTrainerId('')
        setClassName('')
        setScheduleTime('')
        setDurationMinutes('')
        setCapacity('')
        onClassCreated()
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Branch:</label>
      <select value={branchId} onChange={e => setBranchId(e.target.value)} required>
        <option value="">-- Select a branch --</option>
        {branches.map(branch => (
          <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>
        ))}
      </select>
      {errors.branchId && <p style={{ color: '#dc2626' }}>{errors.branchId}</p>}
      <br /><br />

      <label>Trainer:</label>
      <select value={trainerId} onChange={e => setTrainerId(e.target.value)} required>
        <option value="">-- Select a trainer --</option>
        {trainers.map(trainer => (
          <option key={trainer.trainer_id} value={trainer.trainer_id}>{trainer.name}</option>
        ))}
      </select>
      {errors.trainerId && <p style={{ color: '#dc2626' }}>{errors.trainerId}</p>}
      <br /><br />

      <label>Class_Name:</label>
      <input type="text" value={className} onChange={e => setClassName(e.target.value)} required />
      {errors.className && <p style={{ color: '#dc2626' }}>{errors.className}</p>}
      <br /><br />

      <label>Schedule_Time:</label>
      <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} required />
      {errors.scheduleTime && <p style={{ color: '#dc2626' }}>{errors.scheduleTime}</p>}
      <br /><br />

      <label>Duration:</label>
      <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} required />
      {errors.durationMinutes && <p style={{ color: '#dc2626' }}>{errors.durationMinutes}</p>}
      <br /><br />

      <label>Capacity:</label>
      <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required />
      {errors.capacity && <p style={{ color: '#dc2626' }}>{errors.capacity}</p>}
      <br /><br />

      <button type="submit">Add Class</button>
    </form>
  )
}

export default ClassForm
