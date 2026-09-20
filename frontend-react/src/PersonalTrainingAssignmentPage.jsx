import { useState, useEffect } from 'react'
import { API_URL } from './config'
import PersonalTrainingAssignmentList from './PersonalTrainingAssignmentList'
import PersonalTrainingAssignmentForm from './PersonalTrainingAssignmentForm'
import { Activity, Receipt } from 'lucide-react'

function PersonalTrainingAssignmentPage() {
  const [personalTrainingAssignments, setPersonalTrainingAssignments] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadPersonalTrainingAssignments() {
    setLoading(true)
    setPageError('')

    fetch(`${API_URL}/personaltrainingassignments`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Assignments request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setPersonalTrainingAssignments(data))
      .catch(error => {
        console.error('Failed to load personal training assignments:', error)
        setPersonalTrainingAssignments([])
        setPageError('Unable to load assignments. Please try again.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadPersonalTrainingAssignments, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container pt-assignments-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">GYM MANAGEMENT</p>
          <h1>Personal Training</h1>
          <p className="page-description">
            Coordinate one-to-one coaching assignments for your members.
          </p>
        </div>

        <div className="pt-assignment-total">
          <Activity size={19} />
          <span>{personalTrainingAssignments.length}</span>
          <small>Total Assignments</small>
        </div>
      </div>

      <PersonalTrainingAssignmentForm onPersonalTrainingAssignmentCreated={loadPersonalTrainingAssignments} />

      {pageError && (
        <div className="pt-assignment-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (
        <div className="pt-assignment-state">
          <div className="loading-spinner"></div>
          <h3>Loading assignments</h3>
          <p>Getting your coaching schedule ready.</p>
        </div>
      ) : (
        <PersonalTrainingAssignmentList personalTrainingAssignments={personalTrainingAssignments} />
      )}
    </div>
  )
}

export default PersonalTrainingAssignmentPage
