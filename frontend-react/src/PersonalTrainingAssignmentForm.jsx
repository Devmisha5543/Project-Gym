import { useState, useEffect } from 'react'

function PersonalTrainingAssignmentForm({ onPersonalTrainingAssignmentCreated }) {
  const [trainers, setTrainers] = useState([])
  const [members, setMembers] = useState([])
  const [trainerId, setTrainerId] = useState('')
  const [memberId, setMemberId] = useState('')
  const [speciality, setSpeciality] = useState('')
  const [startDate, setStartDate] = useState('')
  const [status, setStatus] = useState('')

  useEffect(() => {
    fetch("http://127.0.0.1:5000/trainers")
      .then(response => response.json())
      .then(data => setTrainers(data))

    fetch("http://127.0.0.1:5000/members")
      .then(response => response.json())
      .then(data => setMembers(data))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const newAssignment = {
      trainer_id: trainerId,
      member_id: memberId,
      speciality,
      start_date: startDate,
      status
    }

    fetch("http://127.0.0.1:5000/personaltrainingassignments", {
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
    <form onSubmit={handleSubmit}>
      <label>Trainer:</label>
      <select value={trainerId} onChange={e => setTrainerId(e.target.value)} required>
        <option value="">-- Select a trainer --</option>
        {trainers.map(trainer => (
          <option key={trainer.trainer_id} value={trainer.trainer_id}>{trainer.name}</option>
        ))}
      </select>
      <br /><br />

      <label>Member:</label>
      <select value={memberId} onChange={e => setMemberId(e.target.value)} required>
        <option value="">-- Select a member --</option>
        {members.map(member => (
          <option key={member.member_id} value={member.member_id}>{member.name}</option>
        ))}
      </select>
      <br /><br />

      <label>Speciality:</label>
      <input type="text" value={speciality} onChange={e => setSpeciality(e.target.value)} required />
      <br /><br />

      <label>Start_Date:</label>
      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
      <br /><br />

      <label>Status:</label>
      <select value={status} onChange={e => setStatus(e.target.value)} required>
        <option value="">-- Select status --</option>
        <option value="active">Active</option>
        <option value="paused">Paused</option>
        <option value="completed">Completed</option>
        <option value="cancelled">Cancelled</option>
      </select>
      <br /><br />

      <button type="submit">Add Assignment</button>
    </form>
  )
}

export default PersonalTrainingAssignmentForm
