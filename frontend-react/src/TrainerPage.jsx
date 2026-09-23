import { useState, useEffect } from 'react'
import { API_URL } from './config'
import TrainerList from './TrainerList'
import TrainerForm from './TrainerForm'
import { Award, Users } from 'lucide-react'

function TrainerPage() {
  const [trainers, setTrainers] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadTrainers() {
    setLoading(true)
    setPageError('')

    fetch(`${API_URL}/trainers`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Trainers request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setTrainers(data))
      .catch(error => {
        console.error('Failed to load trainers:', error)
        setTrainers([])
        setPageError('Unable to load trainers. Please try again.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadTrainers, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container trainers-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">GYM MANAGEMENT</p>
          <h1>Trainers</h1>
          <p className="page-description">
            Manage the coaching team supporting your members.
          </p>
        </div>

        <div className="trainer-total">
          <Users size={19} />
          <span>{trainers.length}</span>
          <small>Total Trainers</small>
        </div>
      </div>

      <TrainerForm onTrainerCreated={loadTrainers} />

      {pageError && (
        <div className="trainer-feedback">
          <Award size={17} />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (
        <div className="trainer-state">
          <div className="loading-spinner"></div>
          <h3>Loading trainers</h3>
          <p>Getting your coaching team ready.</p>
        </div>
      ) : (
        <TrainerList
          trainers={trainers}
          onTrainerUpdated={loadTrainers}
          onTrainerDeleted={loadTrainers}
       />
      )}
    </div>
  )
}

export default TrainerPage
