import { useState, useEffect } from 'react'
import TrainerBranchList from './TrainerBranchList'
import TrainerBranchForm from './TrainerBranchForm'

function TrainerBranchPage() {
  const [trainerBranches, setTrainerBranches] = useState([])

  function loadTrainerBranches() {
    fetch("http://127.0.0.1:5000/trainerbranch")
      .then(response => response.json())
      .then(data => setTrainerBranches(data))
  }

  useEffect(() => {
    loadTrainerBranches()
  }, [])

  return (
    <div>
      <h1>Trainer Branch</h1>
      <TrainerBranchForm onTrainerBranchCreated={loadTrainerBranches} />
      <TrainerBranchList trainerBranches={trainerBranches} onTrainerBranchDeleted={loadTrainerBranches} />
    </div>
  )
}

export default TrainerBranchPage
