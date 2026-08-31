import { useState, useEffect } from 'react'
import ClassList from './ClassList'
import ClassForm from './ClassForm'

function ClassPage() {
  const [classes, setClasses] = useState([])

  function loadClasses() {
    fetch("http://127.0.0.1:5000/classes")
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
