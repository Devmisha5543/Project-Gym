import { useState, useEffect } from 'react'
import { API_URL } from './config'
import ClassList from './ClassList'
import ClassForm from './ClassForm'
import { CalendarDays, Receipt } from 'lucide-react'

function ClassPage() {
  const [classes, setClasses] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadClasses() {
    setLoading(true)
    setPageError('')

    fetch(`${API_URL}/classes`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`Classes request failed: ${response.status}`)
        }

        return response.json()
      })
      .then(data => setClasses(data))
      .catch(error => {
        console.error('Failed to load classes:', error)
        setClasses([])
        setPageError('Unable to load classes. Please try again.')
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadClasses, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container classes-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">GYM MANAGEMENT</p>
          <h1>Classes</h1>
          <p className="page-description">
            Schedule and organize the classes available at your gym.
          </p>
        </div>

        <div className="class-total">
          <CalendarDays size={19} />
          <span>{classes.length}</span>
          <small>Total Classes</small>
        </div>
      </div>

      <ClassForm onClassCreated={loadClasses} />

      {pageError && (
        <div className="class-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (
        <div className="class-state">
          <div className="loading-spinner"></div>
          <h3>Loading classes</h3>
          <p>Getting your class schedule ready.</p>
        </div>
      ) : (
        <ClassList 
        classes={classes}
        onClassUpdated={loadClasses}
        onClassDeleted={loadClasses} 
        />
      )}
    </div>
  )
}

export default ClassPage
