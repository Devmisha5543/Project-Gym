import { useState, useEffect } from 'react'
import PersonalTrainingAssignmentList from './PersonalTrainingAssignmentList'
import PersonalTrainingAssignmentForm from './PersonalTrainingAssignmentForm'

function PersonalTrainingAssignmentPage() {
  const [personalTrainingAssignments, setPersonalTrainingAssignments] = useState([])

  function loadPersonalTrainingAssignments() {
    fetch("http://127.0.0.1:5000/personaltrainingassignments")
      .then(response => response.json())
      .then(data => setPersonalTrainingAssignments(data))
  }

  useEffect(() => {
    loadPersonalTrainingAssignments()
  }, [])

  return (
    <div>
      <h1>Personal Training Assignments</h1>
      <PersonalTrainingAssignmentForm onPersonalTrainingAssignmentCreated={loadPersonalTrainingAssignments} />
      <PersonalTrainingAssignmentList personalTrainingAssignments={personalTrainingAssignments} />
    </div>
  )
}

export default PersonalTrainingAssignmentPage
