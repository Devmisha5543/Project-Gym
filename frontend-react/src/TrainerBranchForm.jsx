import { useState, useEffect } from 'react'
import { API_URL } from './config'

function TrainerBranchForm({ onTrainerBranchCreated }) {
  const [trainers, setTrainers] = useState([])
  const [branches, setBranches] = useState([])
  const [trainerId, setTrainerId] = useState('')
  const [branchId, setBranchId] = useState('')

  useEffect(() => {
    fetch(`${API_URL}/trainers`)
      .then(response => response.json())
      .then(data => setTrainers(data))

    fetch(`${API_URL}/branches`)
      .then(response => response.json())
      .then(data => setBranches(data))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const newTrainerBranch = {
      trainer_id: trainerId,
      branch_id: branchId
    }

    fetch(`${API_URL}/trainerbranch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTrainerBranch)
    })
      .then(response => response.json())
      .then(() => {
        setTrainerId('')
        setBranchId('')
        onTrainerBranchCreated()
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

      <label>Branch:</label>
      <select value={branchId} onChange={e => setBranchId(e.target.value)} required>
        <option value="">-- Select a branch --</option>
        {branches.map(branch => (
          <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>
        ))}
      </select>
      <br /><br />

      <button type="submit">Add Assignment</button>
    </form>
  )
}

export default TrainerBranchForm
