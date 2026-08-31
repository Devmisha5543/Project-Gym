import { useState, useEffect } from 'react'
import AdminList from './AdminList'
import AdminForm from './AdminForm'

function AdminPage() {
  const [admins, setAdmins] = useState([])

  function loadAdmins() {
    fetch("http://127.0.0.1:5000/admins")
      .then(response => response.json())
      .then(data => setAdmins(data))
  }

  useEffect(() => {
    loadAdmins()
  }, [])

  return (
    <div>
      <h1>Admins</h1>
      <AdminForm onAdminCreated={loadAdmins} />
      <AdminList admins={admins} />
    </div>
  )
}

export default AdminPage
