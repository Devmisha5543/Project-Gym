import { useState } from 'react'
import {
  CalendarDays,
  CreditCard,
  UserRound,
  Pencil,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function MembershipList({
  memberships,
  onMembershipUpdated,
  onMembershipDeleted
}) {
  const [editingId, setEditingId] = useState(null)

  const [editForm, setEditForm] = useState({
    member_id: '',
    plan_id: '',
    start_date: '',
    end_date: '',
    status: ''
  })

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  function startEditing(membership) {
    setEditingId(membership.membership_id)

    setEditForm({
      member_id: membership.member_id || '',
      plan_id: membership.plan_id || '',
      start_date: membership.start_date || '',
      end_date: membership.end_date || '',
      status: membership.status || ''
    })

    setError('')
  }

  function cancelEditing() {
    setEditingId(null)

    setEditForm({
      member_id: '',
      plan_id: '',
      start_date: '',
      end_date: '',
      status: ''
    })

    setError('')
  }

  function handleEditChange(field, value) {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function handleUpdate(membershipId) {
    if (!String(editForm.member_id).trim()) {
      setError('Member ID is required.')
      return
    }

    if (!String(editForm.plan_id).trim()) {
      setError('Plan ID is required.')
      return
    }

    if (!editForm.start_date) {
      setError('Start date is required.')
      return
    }

    if (!editForm.end_date) {
      setError('End date is required.')
      return
    }

    if (!editForm.status.trim()) {
      setError('Status is required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await authFetch(
        `${API_URL}/memberships/${membershipId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            member_id: editForm.member_id,
            plan_id: editForm.plan_id,
            start_date: editForm.start_date,
            end_date: editForm.end_date,
            status: editForm.status
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to update membership.'
        )
      }

      setEditingId(null)

      if (onMembershipUpdated) {
        onMembershipUpdated()
      }
    } catch (err) {
      console.error('Failed to update membership:', err)

      setError(
        err.message || 'Unable to update membership.'
      )
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(membership) {
    const confirmed = window.confirm(
      `Are you sure you want to delete Membership #${membership.membership_id}?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(membership.membership_id)
    setError('')

    try {
      const response = await authFetch(
        `${API_URL}/memberships/${membership.membership_id}`,
        {
          method: 'DELETE'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to delete membership.'
        )
      }

      if (onMembershipDeleted) {
        onMembershipDeleted()
      }
    } catch (err) {
      console.error('Failed to delete membership:', err)

      setError(
        err.message || 'Unable to delete membership.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (memberships.length === 0) {
    return (
      <div className="membership-state membership-empty-state">
        <div className="membership-state-icon">
          <CreditCard size={25} />
        </div>

        <h3>No memberships yet</h3>

        <p>
          Create a membership above to start tracking
          plans and expiration dates.
        </p>
      </div>
    )
  }

  return (
    <div className="membership-list">

      {error && (
        <div className="membership-feedback membership-feedback-error">
          <span>{error}</span>
        </div>
      )}

      {memberships.map(membership => (

        <article
          className="membership-card"
          key={membership.membership_id}
        >

          <div className="membership-card-icon">
            <CreditCard size={20} />
          </div>

          <div className="membership-card-main">

            {editingId === membership.membership_id ? (

              /* =========================
                 EDIT MODE
                 ========================= */

              <div>

                <div className="membership-card-title-row">

                  <div>

                    <span className="membership-card-label">
                      Editing Membership #{membership.membership_id}
                    </span>

                    <h2>Edit Membership</h2>

                  </div>

                </div>

                <div className="membership-form-grid">

                  <label className="membership-field">

                    <span>Member ID</span>

                    <div className="membership-input-wrap">

                      <UserRound size={16} />

                      <input
                        type="number"
                        value={editForm.member_id}
                        onChange={e =>
                          handleEditChange(
                            'member_id',
                            e.target.value
                          )
                        }
                        disabled={saving}
                      />

                    </div>

                  </label>

                  <label className="membership-field">

                    <span>Plan ID</span>

                    <div className="membership-input-wrap">

                      <CreditCard size={16} />

                      <input
                        type="number"
                        value={editForm.plan_id}
                        onChange={e =>
                          handleEditChange(
                            'plan_id',
                            e.target.value
                          )
                        }
                        disabled={saving}
                      />

                    </div>

                  </label>

                  <label className="membership-field">

                    <span>Start Date</span>

                    <div className="membership-input-wrap">

                      <CalendarDays size={16} />

                      <input
                        type="date"
                        value={editForm.start_date}
                        onChange={e =>
                          handleEditChange(
                            'start_date',
                            e.target.value
                          )
                        }
                        disabled={saving}
                      />

                    </div>

                  </label>

                  <label className="membership-field">

                    <span>End Date</span>

                    <div className="membership-input-wrap">

                      <CalendarDays size={16} />

                      <input
                        type="date"
                        value={editForm.end_date}
                        onChange={e =>
                          handleEditChange(
                            'end_date',
                            e.target.value
                          )
                        }
                        disabled={saving}
                      />

                    </div>

                  </label>

                  <label className="membership-field">

                    <span>Status</span>

                    <div className="membership-input-wrap">

                      <CreditCard size={16} />

                      <select
                        value={editForm.status}
                        onChange={e =>
                          handleEditChange(
                            'status',
                            e.target.value
                          )
                        }
                        disabled={saving}
                      >

                        <option value="">
                          Select status
                        </option>

                        <option value="active">
                          Active
                        </option>

                        <option value="expired">
                          Expired
                        </option>

                        <option value="cancelled">
                          Cancelled
                        </option>

                      </select>

                    </div>

                  </label>

                </div>

                <div className="membership-card-actions">

                  <button
                    type="button"
                    className="membership-primary-button"
                    onClick={() =>
                      handleUpdate(
                        membership.membership_id
                      )
                    }
                    disabled={saving}
                  >

                    <Save size={15} />

                    {saving
                      ? 'Saving...'
                      : 'Save Changes'}

                  </button>

                  <button
                    type="button"
                    className="membership-secondary-button"
                    onClick={cancelEditing}
                    disabled={saving}
                  >

                    <X size={15} />

                    Cancel

                  </button>

                </div>

              </div>

            ) : (

              /* =========================
                 NORMAL MODE
                 ========================= */

              <>

                <div className="membership-card-title-row">

                  <div>

                    <span className="membership-card-label">
                      Membership #{membership.membership_id}
                    </span>

                    <h2>
                      {membership.member_name ||
                        `Member ${membership.member_id}`}
                    </h2>

                  </div>

                  <span
                    className={`membership-status membership-status-${String(
                      membership.status || 'unknown'
                    ).toLowerCase()}`}
                  >
                    {membership.status ||
                      'Status unavailable'}
                  </span>

                </div>

                <div className="membership-card-meta">

                  <span>
                    <UserRound size={15} />

                    {membership.member_name ||
                      `Member #${membership.member_id}`}
                  </span>

                  <span>
                    <CreditCard size={15} />

                    {membership.plan_name ||
                      `Plan #${membership.plan_id}`}
                  </span>

                </div>

                <div className="membership-card-dates">

                  <div>

                    <span>Starts</span>

                    <strong>

                      <CalendarDays size={14} />

                      {membership.start_date}

                    </strong>

                  </div>

                  <div>

                    <span>Expires</span>

                    <strong>

                      <CalendarDays size={14} />

                      {membership.end_date}

                    </strong>

                  </div>

                </div>

                <div className="membership-card-actions">

                  <button
                    type="button"
                    className="membership-secondary-button"
                    onClick={() =>
                      startEditing(membership)
                    }
                  >

                    <Pencil size={15} />

                    Edit

                  </button>

                  <button
                    type="button"
                    className="membership-danger-button"
                    onClick={() =>
                      handleDelete(membership)
                    }
                    disabled={
                      deletingId ===
                      membership.membership_id
                    }
                  >

                    <Trash2 size={15} />

                    {deletingId ===
                    membership.membership_id
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

export default MembershipList