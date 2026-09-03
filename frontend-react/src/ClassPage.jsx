import { useState, useEffect } from 'react'
import { API_URL } from './config'
import ClassList from './ClassList'
import ClassForm from './ClassForm'

function ClassPage() {
  const [classes, setClasses] = useState([])

  function loadClasses() {
    fetch(`${API_URL}/classes`)
      .then(response => response.json())
      .then(data => setClasses(data))
  }

  useEffect(() => {
    loadClasses()
  }, [])

  return (
    <div>
      <h1>Classes</h1>
      <ClassForm onClassCreated={loadClasses} />
      <ClassList classes={classes} />
    </div>
  )
}

export default ClassPage
