import { useState, useEffect } from 'react'
import { API_URL } from './config'
import AdminList from './AdminList'
import AdminForm from './AdminForm'
import { Receipt, ShieldCheck } from 'lucide-react'

function AdminPage() {
  const [admins, setAdmins] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadAdmins() {
    setLoading(true); setPageError('')
    fetch(`${API_URL}/admins`)
      .then(response => { if (!response.ok) throw new Error(`Admins request failed: ${response.status}`); return response.json() })
      .then(data => setAdmins(data))
      .catch(error => { console.error('Failed to load admins:', error); setAdmins([]); setPageError('Admin accounts cannot be loaded because the current API does not expose an admin list.') })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadAdmins, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container admins-page"><div className="page-header"><div><p className="page-eyebrow">SYSTEM</p><h1>Admins</h1><p className="page-description">Manage administrator contact details securely.</p></div><div className="admin-total"><ShieldCheck size={19} /><span>{admins.length}</span><small>Visible Admins</small></div></div>
      <AdminForm onAdminCreated={loadAdmins} />
      {pageError && <div className="admin-feedback"><Receipt size={17} /><span>{pageError}</span></div>}
      {loading ? <div className="admin-state"><div className="loading-spinner"></div><h3>Loading administrators</h3><p>Checking available admin records.</p></div> : <AdminList admins={admins} />}
    </div>
  )
}

export default AdminPage
