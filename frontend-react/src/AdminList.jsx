import { useState } from 'react'
import { useTranslation } from 'react-i18next'
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
  const { t } = useTranslation(['admin', 'common'])
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

        <h3>{t('noAdmins')}</h3>

        <p>{t('noAdminsDescription')}</p>
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
                  <span>{t('name')}</span>

                  <div className="admin-input-wrap">
                    <UserRound size={15} />

                    <input
                      value={name}
                      onChange={e => setName(e.target.value)}
                    />
                  </div>
                </label>

                <label className="admin-field">
                  <span>{t('email')}</span>

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
                  <span>{t('phone')}</span>

                  <div className="admin-input-wrap">
                    <Phone size={15} />

                    <input
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                    />
                  </div>
                </label>

                <label className="admin-field">
                  <span>{t('newPassword')}</span>

                  <div className="admin-input-wrap">
                    <KeyRound size={15} />

                    <input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder={t('keepPasswordEmpty')}
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
                  {t('saveChanges', { ns: 'common' })}
                </button>

                <button
                  type="button"
                  className="admin-secondary-button"
                  onClick={cancelEditing}
                >
                  <X size={15} />
                  {t('cancel', { ns: 'common' })}
                </button>

              </div>

            </div>

          ) : (

            <div className="admin-card-main">

              <div className="admin-card-title-row">
                <div>
                  <span className="admin-card-label">
                    {t('adminCardLabel', { id: admin.admin_id })}
                  </span>

                  <h2>{admin.name}</h2>
                </div>

                {admin.admin_id === 1 && (
                  <span className="admin-super-badge">
                    <ShieldCheck size={13} />
                    {t('superAdmin')}
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
                  {t('edit', { ns: 'common' })}
                </button>

                {admin.admin_id !== 1 && (
                  <button
                    type="button"
                    className="admin-danger-button"
                    onClick={() => onAdminDeleted(admin.admin_id)}
                  >
                    <Trash2 size={15} />
                    {t('delete', { ns: 'common' })}
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