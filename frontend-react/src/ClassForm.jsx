import { useState, useEffect } from 'react'
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
      <br /><br />

      <label>Trainer:</label>
      <select value={trainerId} onChange={e => setTrainerId(e.target.value)} required>
        <option value="">-- Select a trainer --</option>
        {trainers.map(trainer => (
          <option key={trainer.trainer_id} value={trainer.trainer_id}>{trainer.name}</option>
        ))}
      </select>
      <br /><br />

      <label>Class_Name:</label>
      <input type="text" value={className} onChange={e => setClassName(e.target.value)} required />
      <br /><br />

      <label>Schedule_Time:</label>
      <input type="datetime-local" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} required />
      <br /><br />

      <label>Duration:</label>
      <input type="number" value={durationMinutes} onChange={e => setDurationMinutes(e.target.value)} required />
      <br /><br />

      <label>Capacity:</label>
      <input type="number" value={capacity} onChange={e => setCapacity(e.target.value)} required />
      <br /><br />

      <button type="submit">Add Class</button>
    </form>
  )
}

export default ClassForm
