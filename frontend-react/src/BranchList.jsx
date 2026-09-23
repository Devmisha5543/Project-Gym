import { useState } from 'react'
import { Building2, MapPin, Phone, Pencil, Trash2, Save, X } from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function BranchList({ branches, onBranchUpdated, onBranchDeleted }) {
  const [editingId, setEditingId] = useState(null)

  const [editForm, setEditForm] = useState({
    name: '',
    address: '',
    phone: '',
    city: ''
  })

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  function startEditing(branch) {
    setEditingId(branch.branch_id)

    setEditForm({
      name: branch.name || '',
      address: branch.address || '',
      phone: branch.phone || '',
      city: branch.city || ''
    })

    setError('')
  }

  function cancelEditing() {
    setEditingId(null)

    setEditForm({
      name: '',
      address: '',
      phone: '',
      city: ''
    })

    setError('')
  }

  function handleEditChange(field, value) {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function handleUpdate(branchId) {
    if (!editForm.name.trim()) {
      setError('Branch name is required.')
      return
    }

    if (!editForm.address.trim()) {
      setError('Address is required.')
      return
    }

    if (!editForm.phone.trim()) {
      setError('Phone is required.')
      return
    }

    if (!editForm.city.trim()) {
      setError('City is required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await authFetch(`${API_URL}/branches/${branchId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: editForm.name.trim(),
          address: editForm.address.trim(),
          phone: editForm.phone.trim(),
          city: editForm.city.trim()
        })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update branch.')
      }

      setEditingId(null)

      if (onBranchUpdated) {
        onBranchUpdated()
      }
    } catch (err) {
      console.error('Failed to update branch:', err)
      setError(err.message || 'Unable to update branch.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(branch) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${branch.name}"?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(branch.branch_id)
    setError('')

    try {
      const response = await authFetch(
        `${API_URL}/branches/${branch.branch_id}`,
        {
          method: 'DELETE'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete branch.')
      }

      if (onBranchDeleted) {
        onBranchDeleted()
      }
    } catch (err) {
      console.error('Failed to delete branch:', err)
      setError(err.message || 'Unable to delete branch.')
    } finally {
      setDeletingId(null)
    }
  }

  if (branches.length === 0) {
    return (
      <div className="branch-state branch-empty-state">
        <div className="branch-state-icon">
          <Building2 size={25} />
        </div>

        <h3>No branches yet</h3>
        <p>Add your first gym location above to get started.</p>
      </div>
    )
  }

  return (
    <div className="branch-list">

      {error && (
        <div className="branch-feedback branch-feedback-error">
          <span>{error}</span>
        </div>
      )}

      {branches.map(branch => (
        <article className="branch-card" key={branch.branch_id}>

          <div className="branch-card-icon">
            <Building2 size={20} />
          </div>

          <div className="branch-card-main">

            {editingId === branch.branch_id ? (

              /* EDIT MODE */
              <div>
                <div className="branch-card-title-row">
                  <div>
                    <span className="branch-card-label">
                      Editing Branch #{branch.branch_id}
                    </span>

                    <h2>Edit Branch</h2>
                  </div>
                </div>

                <div className="branch-form-grid">

                  <label className="branch-field">
                    <span>Branch name</span>

                    <div className="branch-input-wrap">
                      <Building2 size={16} />

                      <input
                        type="text"
                        value={editForm.name}
                        onChange={e =>
                          handleEditChange('name', e.target.value)
                        }
                        disabled={saving}
                      />
                    </div>
                  </label>

                  <label className="branch-field">
                    <span>City</span>

                    <div className="branch-input-wrap">
                      <MapPin size={16} />

                      <input
                        type="text"
                        value={editForm.city}
                        onChange={e =>
                          handleEditChange('city', e.target.value)
                        }
                        disabled={saving}
                      />
                    </div>
                  </label>

                  <label className="branch-field">
                    <span>Address</span>

                    <div className="branch-input-wrap">
                      <MapPin size={16} />

                      <input
                        type="text"
                        value={editForm.address}
                        onChange={e =>
                          handleEditChange('address', e.target.value)
                        }
                        disabled={saving}
                      />
                    </div>
                  </label>

                  <label className="branch-field">
                    <span>Phone</span>

                    <div className="branch-input-wrap">
                      <Phone size={16} />

                      <input
                        type="text"
                        value={editForm.phone}
                        onChange={e =>
                          handleEditChange('phone', e.target.value)
                        }
                        disabled={saving}
                      />
                    </div>
                  </label>

                </div>

                <div className="branch-form-actions">

                  <button
                    type="button"
                    className="branch-primary-button"
                    onClick={() => handleUpdate(branch.branch_id)}
                    disabled={saving}
                  >
                    <Save size={16} />

                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>

                  <button
                    type="button"
                    className="branch-secondary-button"
                    onClick={cancelEditing}
                    disabled={saving}
                  >
                    <X size={16} />
                    Cancel
                  </button>

                </div>
              </div>

            ) : (

              /* NORMAL MODE */
              <>
                <div className="branch-card-title-row">

                  <div>
                    <span className="branch-card-label">
                      Branch #{branch.branch_id}
                    </span>

                    <h2>{branch.name}</h2>
                  </div>

                  <span className="branch-status">
                    Operational
                  </span>

                </div>

                <div className="branch-card-details">

                  <span>
                    <MapPin size={15} />

                    {branch.address || 'Address not provided'}

                    {branch.city
                      ? `, ${branch.city}`
                      : ''}
                  </span>

                  <span>
                    <Phone size={15} />

                    {branch.phone || 'Phone not provided'}
                  </span>

                </div>

                <div className="branch-card-actions">

                  <button
                    type="button"
                    className="branch-secondary-button"
                    onClick={() => startEditing(branch)}
                  >
                    <Pencil size={15} />
                    Edit
                  </button>

                  <button
                    type="button"
                    className="branch-danger-button"
                    onClick={() => handleDelete(branch)}
                    disabled={deletingId === branch.branch_id}
                  >
                    <Trash2 size={15} />

                    {deletingId === branch.branch_id
                      ? 'Deleting...'
                      : 'Delete'}
                  </button>

                </div>
              </>

            )}

          </div>
        </article>
      ))}
    </div>
  )
}

export default BranchList