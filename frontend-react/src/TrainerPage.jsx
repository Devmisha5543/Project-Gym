import { useState, useEffect } from 'react'
import TrainerList from './TrainerList'
import TrainerForm from './TrainerForm'

function TrainerPage() {
  const [trainers, setTrainers] = useState([])

  function loadTrainers() {
    fetch("http://127.0.0.1:5000/trainers")
      .then(response => response.json())
      .then(data => setTrainers(data))
  }

  useEffect(() => {
    loadTrainers()
  }, [])

  return (
    <div>
      <h1>Trainers</h1>
      <TrainerForm onTrainerCreated={loadTrainers} />
      <TrainerList trainers={trainers} />
    </div>
  )
}

export default TrainerPage
