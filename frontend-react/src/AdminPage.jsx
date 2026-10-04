import { useEffect, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import AdminList from './AdminList'
import AdminForm from './AdminForm'
import { Receipt, ShieldCheck } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function AdminPage() {
  const { t } = useTranslation(['admin', 'common'])
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [operationFeedback, setOperationFeedback] = useState(null)

  const loadAdmins = useCallback(() => {
    setLoading(true)
    setPageError('')

    authFetch(`${API_URL}/admins`)
      .then(async response => {
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || t('adminLoadFailed'))
        }

        return data
      })
      .then(data => setAdmins(Array.isArray(data) ? data : []))
      .catch(error => {
        console.error('Failed to load admins:', error)
        setAdmins([])
        setPageError(error.message || t('adminLoadFailed'))
      })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadAdmins, 0)
    return () => clearTimeout(loadTimer)
  }, [loadAdmins])

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
          throw new Error(result.error || t('adminUpdateFailed'))
        }

        return result
      })
      .then(() => {
        loadAdmins()
        setOperationFeedback({ type: 'success', message: t('adminUpdated') })
      })
      .catch(error => {
        setOperationFeedback({ type: 'error', message: error.message || t('adminUpdateFailed') })
        throw error
      })
  }

  function deleteAdmin(adminId) {
    const confirmed = window.confirm(
      t('deleteAdminConfirm')
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
          throw new Error(data.error || t('adminDeleteFailed'))
        }

        return data
      })
      .then(() => {
        loadAdmins()
        setOperationFeedback({ type: 'success', message: t('adminDeleted') })
      })
      .catch(error => {
        console.error('Failed to delete admin:', error)
        setOperationFeedback({ type: 'error', message: error.message || t('adminDeleteFailed') })
      })
  }

  return (
    <div className="page-container admins-page">

      <div className="page-header">
        <div>
          <p className="page-eyebrow">{t('eyebrow')}</p>

          <h1>{t('adminTitle')}</h1>

          <p className="page-description">
            {t('adminDescription')}
          </p>
        </div>

        <div className="admin-total">
          <ShieldCheck size={19} />

          <span>{admins.length}</span>

          <small>{t('visibleAdmins')}</small>
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

          <h3>{t('loadingAdmins')}</h3>

          <p>{t('checkingRecords')}</p>
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
