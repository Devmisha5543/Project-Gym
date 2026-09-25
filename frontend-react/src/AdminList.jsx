import { useState } from 'react'
import {
  KeyRound,
  Mail,
  Pencil,
  Phone,
  Save,
  ShieldCheck,
  Trash2,
  UserRound,
  X
} from 'lucide-react'

function AdminList({ admins, onAdminUpdated, onAdminDeleted }) {
  const [editingId, setEditingId] = useState(null)

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  function startEditing(admin) {
    setEditingId(admin.admin_id)
    setName(admin.name || '')
    setEmail(admin.email || '')
    setPhone(admin.phone || '')
    setPassword('')
  }

  function cancelEditing() {
    setEditingId(null)
    setName('')
    setEmail('')
    setPhone('')
    setPassword('')
  }

  function handleUpdate(adminId) {
    const payload = {
      name,
      email,
      phone
    }

    if (password.trim()) {
      payload.password = password
    }

    onAdminUpdated(adminId, payload)
      .then(() => {
        cancelEditing()
      })
      .catch(() => {})
  }

  if (admins.length === 0) {
    return (
      <div className="admin-state">
        <div className="admin-state-icon">
          <ShieldCheck size={25} />
        </div>

        <h3>No admin records</h3>

        <p>
          Create an administrator above to manage access.
        </p>
      </div>
    )
  }

  return (
    <div className="admin-list">
      {admins.map(admin => (
        <article className="admin-card" key={admin.admin_id}>

          <div className="admin-card-icon">
            <UserRound size={20} />
          </div>

          {editingId === admin.admin_id ? (

            <div className="admin-edit-area">

              <div className="admin-edit-grid">

                <label className="admin-field">
                  <span>Name</span>

                  <div className="admin-input-wrap">
                    <UserRound size={15} />

                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </label>

                <label className="admin-field">
                  <span>Email</span>

                  <div className="admin-input-wrap">
                    <Mail size={15} />

                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                    />
                  </div>
                </label>

                <label className="admin-field">
                  <span>Phone</span>

                  <div className="admin-input-wrap">
                    <Phone size={15} />

                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </label>

                <label className="admin-field">
                  <span>New password</span>

                  <div className="admin-input-wrap">
                    <KeyRound size={15} />

                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="Leave empty to keep current"
                    />
                  </div>
                </label>

              </div>

              <div className="admin-card-actions">

                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={() => handleUpdate(admin.admin_id)}
                >
                  <Save size={15} />
                  Save Changes
                </button>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={cancelEditing}
                >
                  <X size={15} />
                  Cancel
                </button>

              </div>

            </div>

          ) : (

            <div className="admin-card-main">

              <div className="admin-card-title-row">
                <div>
                  <span className="admin-card-label">
                    Administrator #{admin.admin_id}
                  </span>

                  <h2>{admin.name}</h2>
                </div>

                {admin.admin_id === 1 && (
                  <span className="admin-super-badge">
                    <ShieldCheck size={13} />
                    Super Admin
                  </span>
                )}
              </div>

              <div className="admin-card-details">
                <span>
                  <Mail size={15} />
                  {admin.email}
                </span>

                <span>
                  <Phone size={15} />
                  {admin.phone}
                </span>
              </div>

              <div className="admin-card-actions">

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={() => startEditing(admin)}
                >
                  <Pencil size={15} />
                  Edit
                </button>

                {admin.admin_id !== 1 && (
                  <button
                    type="button"
                    className="admin-danger-button"
                    onClick={() => onAdminDeleted(admin.admin_id)}
                  >
                    <Trash2 size={15} />
                    Delete
                    </button>
)}
                  
              </div>

            </div>

          )}

        </article>
      ))}
    </div>
  )
}

export default AdminList