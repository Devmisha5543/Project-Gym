import { useEffect, useState } from 'react'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import AdminList from './AdminList'
import AdminForm from './AdminForm'
import { Receipt, ShieldCheck } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function AdminPage() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [operationFeedback, setOperationFeedback] = useState(null)

  function loadAdmins() {
    setLoading(true)
    setPageError('')

    authFetch(`${API_URL}/admins`)
      .then(async response => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to load admins')
        }

        return data
      })
      .then(data => setAdmins(data))
      .catch(error => {
        console.error('Failed to load admins:', error)
        setAdmins([])
        setPageError(error.message)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadAdmins, 0)

    return () => clearTimeout(loadTimer)
  }, [])

  function updateAdmin(adminId, data) {
    setOperationFeedback(null)
    return authFetch(`${API_URL}/admins/${adminId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data)
    })
      .then(async response => {
        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error || 'Failed to update admin')
        }

        return result
      })
      .then(() => {
        loadAdmins()
        setOperationFeedback({ type: 'success', message: 'Administrator updated successfully.' })
      })
      .catch(error => {
        setOperationFeedback({ type: 'error', message: error.message || 'Unable to update administrator.' })
        throw error
      })
  }

  function deleteAdmin(adminId) {
    const confirmed = window.confirm(
      'Are you sure you want to delete this administrator?'
    )

    if (!confirmed) {
      return
    }

    setOperationFeedback(null)
    authFetch(`${API_URL}/admins/${adminId}`, {
      method: 'DELETE'
    })
      .then(async response => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || 'Failed to delete admin')
        }

        return data
      })
      .then(() => {
        loadAdmins()
        setOperationFeedback({ type: 'success', message: 'Administrator deleted successfully.' })
      })
      .catch(error => {
        console.error('Failed to delete admin:', error)
        setOperationFeedback({ type: 'error', message: error.message || 'Unable to delete administrator.' })
      })
  }

  return (
    <div className="page-container admins-page">

      <div className="page-header">
        <div>
          <p className="page-eyebrow">SYSTEM</p>

          <h1>Admins</h1>

          <p className="page-description">
            Manage administrator accounts and access securely.
          </p>
        </div>

        <div className="admin-total">
          <ShieldCheck size={19} />

          <span>{admins.length}</span>

          <small>Visible Admins</small>
        </div>
      </div>

      <AdminForm onAdminCreated={loadAdmins} />

      <FeedbackMessage message={operationFeedback?.message} type={operationFeedback?.type} />

      {pageError && (
        <div className="admin-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}

      {loading ? (
        <div className="admin-state">
          <div className="loading-spinner"></div>

          <h3>Loading administrators</h3>

          <p>
            Checking available admin records.
          </p>
        </div>
      ) : (
        <AdminList
          admins={admins}
          onAdminUpdated={updateAdmin}
          onAdminDeleted={deleteAdmin}
        />
      )}

    </div>
  )
}

export default AdminPage
