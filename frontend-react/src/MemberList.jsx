import {
  UserRound,
  Phone,
  MapPin,
  CalendarDays,
  Pencil,
  Trash2,
  ChevronDown,
  X,
  Save,
  UserRoundCheck
} from 'lucide-react'
import { useState } from 'react'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { memberSchema } from './schemas'

function MemberList({ members, branches, onMemberUpdated, onMemberDeleted, onFeedback }) {
  const [expandedMemberId, setExpandedMemberId] = useState(null)
  const [editingMemberId, setEditingMemberId] = useState(null)
  const [deleteMemberId, setDeleteMemberId] = useState(null)
  const [editValues, setEditValues] = useState({})
  const [newPhoto, setNewPhoto] = useState(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  if (members.length === 0) {
    return (
      <div className="empty-members">

        <div className="empty-icon">
          <UserRound size={32} />
        </div>

        <h3>No members found</h3>

        <p>
          Try changing your search or branch filter.
        </p>

      </div>
    )
  }

  function getPhotoUrl(member) {
    const photo = member.photo_filename || member.photo
    if (!photo) return null

    if (/^(https?:|data:|blob:)/i.test(photo)) return photo
    if (photo.startsWith('/')) return `${API_URL}${photo}`

    return `${API_URL}/uploads/${encodeURIComponent(photo)}`
  }

  function getBranchName(member) {
    return branches?.find(branch => (
      String(branch.branch_id) === String(member.branch_id)
    ))?.name || `Branch ${member.branch_id}`
  }

  function expandMember(member) {
    setExpandedMemberId(currentId => (
      currentId === member.member_id ? null : member.member_id
    ))
    setEditingMemberId(null)
    setDeleteMemberId(null)
  }

  function startEditing(member) {
    setExpandedMemberId(member.member_id)
    setEditingMemberId(member.member_id)
    setDeleteMemberId(null)
    setEditValues({
      name: member.name || '',
      phone: member.phone || '',
      gender: member.gender || '',
      branch_id: member.branch_id || '',
      address: member.address || '',
      join_date: toDateInputValue(member.join_date),
      wants_trainer: Boolean(member.wants_trainer)
    })
    setNewPhoto(null)
    setNewPhotoPreview(null)
  }

  function cancelEditing() {
    setEditingMemberId(null)
    setNewPhoto(null)
    setNewPhotoPreview(null)
  }

  function saveMember(member) {
    const validation = memberSchema.safeParse({
      name: editValues.name,
      phone: editValues.phone,
      email: ''
    })

    if (!validation.success) {
      onFeedback?.(validation.error.issues[0]?.message || 'Failed to update member.', 'error')
      return
    }

    setSaving(true)
    const formData = new FormData()

    Object.entries(editValues).forEach(([key, value]) => {
      formData.append(key, String(value))
    })

    if (newPhoto) formData.append('photo', newPhoto)

    authFetch(`${API_URL}/members/${member.member_id}`, {
      method: 'PUT',
      body: formData
    })
      .then(response => {
        return response.json().catch(() => ({})).then(data => {
          if (!response.ok) {
            throw new Error(data.error || 'Failed to update member')
          }

          return data
        })
      })
      .then(data => {
        const updatedMember = data.member || {
          ...member,
          ...editValues,
          photo_filename: newPhoto ? newPhoto.name : member.photo_filename
        }

        onMemberUpdated?.(updatedMember)
        cancelEditing()
        onFeedback?.('Member updated successfully.', 'success')
      })
      .catch(error => {
        console.error('Failed to update member:', error)
        onFeedback?.(error.message || 'Failed to update member.', 'error')
      })
      .finally(() => setSaving(false))
  }

  function deleteMember(member) {
    setDeleteMemberId(member.member_id)
  }

  function confirmDelete(member) {
    setDeleting(true)

    authFetch(`${API_URL}/members/${member.member_id}`, {
      method: 'DELETE'
    })
      .then(response => {
        return response.json().catch(() => ({})).then(data => {
          if (!response.ok) {
            throw new Error(data.error || 'Failed to delete member')
          }

          return data
        })
      })
      .then(() => {
        onMemberDeleted?.(member.member_id)
        setExpandedMemberId(null)
        setDeleteMemberId(null)
        onFeedback?.('Member deleted successfully.', 'success')
      })
      .catch(error => {
        console.error('Failed to delete member:', error)
        onFeedback?.(error.message || 'Failed to delete member.', 'error')
      })
      .finally(() => setDeleting(false))
  }

  function handlePhotoChange(event) {
    const file = event.target.files[0]
    if (!file) return

    setNewPhoto(file)
    setNewPhotoPreview(URL.createObjectURL(file))
  }

  function updateEditValue(key, value) {
    setEditValues(currentValues => ({ ...currentValues, [key]: value }))
  }

  return (
    <div className="members-grid">

      {members.map((member, index) => (

        <article
          className={`member-card ${expandedMemberId === member.member_id ? 'member-card-expanded' : ''}`}
          key={member.member_id}
          style={{
            animationDelay: `${index * 50}ms`
          }}
        >

          {/* Compact member summary */}
          <div className="member-avatar">

            <MemberPhoto
              key={getPhotoUrl(member) || 'member-avatar'}
              member={member}
              photoUrl={getPhotoUrl(member)}
              alt={member.name}
            />

          </div>

          {/* Main information */}
          <div className="member-info">

            <div className="member-name-row">

              <h3>{member.name}</h3>

              <span className="member-status">
                Active
              </span>

            </div>

            <div className="member-details">

              <div>
                <Phone size={15} />
                <span>{member.phone}</span>
              </div>

              {member.address && (
                <div>
                  <MapPin size={15} />
                  <span>{member.address}</span>
                </div>
              )}

              {member.join_date && (
                <div>
                  <CalendarDays size={15} />
                  <span>
                    Joined {member.join_date}
                  </span>
                </div>
              )}

            </div>

          </div>

          <button
            type="button"
            className="member-details-button"
            onClick={() => expandMember(member)}
          >
            <span>{expandedMemberId === member.member_id ? 'Hide Details' : 'View Details'}</span>
            <ChevronDown className={expandedMemberId === member.member_id ? 'rotate-icon' : ''} size={17} />
          </button>

          {expandedMemberId === member.member_id && (
            <div className="member-expanded-area">
              <div className="member-profile-heading">
                <div className="member-avatar member-avatar-large">
                  <MemberPhoto
                    key={getPhotoUrl(member) || 'member-profile'}
                    member={member}
                    photoUrl={getPhotoUrl(member)}
                    alt={member.name}
                  />
                </div>
                <div>
                  <span className="member-detail-label">Member profile</span>
                  <h4>{editingMemberId === member.member_id ? editValues.name : member.name}</h4>
                </div>
              </div>

              {editingMemberId === member.member_id ? (
                <div className="member-edit-fields">
                  <label>
                    Full name
                    <input value={editValues.name} onChange={event => updateEditValue('name', event.target.value)} />
                  </label>
                  <label>
                    Phone
                    <input value={editValues.phone} onChange={event => updateEditValue('phone', event.target.value)} />
                  </label>
                  <label>
                    Gender
                    <select value={editValues.gender} onChange={event => updateEditValue('gender', event.target.value)}>
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </label>
                  <label>
                    Branch
                    <select value={editValues.branch_id} onChange={event => updateEditValue('branch_id', event.target.value)}>
                      <option value="">Select a branch</option>
                      {branches?.map(branch => (
                        <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Address
                    <input value={editValues.address} onChange={event => updateEditValue('address', event.target.value)} />
                  </label>
                  <label>
                    Join Date
                    <input type="date" value={editValues.join_date} onChange={event => updateEditValue('join_date', event.target.value)} />
                  </label>
                  <label className="member-edit-checkbox">
                    <input type="checkbox" checked={editValues.wants_trainer} onChange={event => updateEditValue('wants_trainer', event.target.checked)} />
                    Member wants a personal trainer
                  </label>
                  <div className="member-photo-edit">
                    <span>Current Photo</span>
                    <div className="member-photo-edit-row">
                      <div className="member-avatar member-avatar-small">
                        <MemberPhoto
                          key={newPhotoPreview || getPhotoUrl(member) || 'member-edit-photo'}
                          member={member}
                          photoUrl={newPhotoPreview || getPhotoUrl(member)}
                          alt="Member preview"
                        />
                      </div>
                      <label className="member-upload-button">
                        <span>{newPhoto ? 'Replace Photo' : 'Change Photo'}</span>
                        <input type="file" accept="image/*" onChange={handlePhotoChange} />
                      </label>
                      {newPhoto && (
                        <button type="button" className="member-action secondary-action" onClick={() => { setNewPhoto(null); setNewPhotoPreview(null) }}>
                          <X size={16} /> Remove selection
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="member-expanded-details">
                  <div><UserRound size={15} /><span>Full name<strong>{member.name}</strong></span></div>
                  <div><Phone size={15} /><span>Phone<strong>{member.phone || 'Not provided'}</strong></span></div>
                  <div><UserRoundCheck size={15} /><span>Gender<strong>{member.gender || 'Not provided'}</strong></span></div>
                  <div><MapPin size={15} /><span>Branch<strong>{getBranchName(member)}</strong></span></div>
                  <div><MapPin size={15} /><span>Address<strong>{member.address || 'Not provided'}</strong></span></div>
                  <div><CalendarDays size={15} /><span>Join date<strong>{member.join_date || 'Not provided'}</strong></span></div>
                  <div><UserRoundCheck size={15} /><span>Personal trainer<strong>{member.wants_trainer ? 'Yes' : 'No'}</strong></span></div>
                  <div><UserRoundCheck size={15} /><span>Status<strong>Active</strong></span></div>
                </div>
              )}

              <div className="member-expanded-actions">
                {editingMemberId === member.member_id ? (
                  <>
                    <button type="button" className="member-action edit-action" onClick={() => saveMember(member)} disabled={saving || !editValues.name || !editValues.phone}>
                      <Save size={16} /> Save Changes
                    </button>
                    <button type="button" className="member-action secondary-action" onClick={cancelEditing} disabled={saving}>
                      <X size={16} /> Cancel
                    </button>
                  </>
                ) : (
                  <button type="button" className="member-action edit-action" onClick={() => startEditing(member)}>
                    <Pencil size={16} /> Edit Member
                  </button>
                )}
                <button type="button" className="member-action delete-action" onClick={() => deleteMember(member)}>
                  <Trash2 size={16} /> Delete
                </button>
              </div>

              {deleteMemberId === member.member_id && (
                <div className="member-delete-confirmation">
                  <strong>Are you sure you want to delete this member?</strong>
                  <span>This action cannot be undone.</span>
                  <div className="member-confirmation-actions">
                    <button type="button" className="member-action secondary-action" onClick={() => setDeleteMemberId(null)} disabled={deleting}>Cancel</button>
                    <button type="button" className="member-action delete-action" onClick={() => confirmDelete(member)} disabled={deleting}>Delete</button>
                  </div>
                </div>
              )}
            </div>
          )}
        </article>

      ))}

    </div>
  )
}

function toDateInputValue(value) {
  if (!value) return ''

  const valueText = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(valueText)) return valueText

  const parsedDate = new Date(valueText)
  return Number.isNaN(parsedDate.getTime())
    ? ''
    : parsedDate.toISOString().slice(0, 10)
}

function MemberPhoto({ member, photoUrl, alt }) {
  const [failed, setFailed] = useState(false)

  if (!photoUrl || failed) {
    return <span>{member.name?.charAt(0).toUpperCase()}</span>
  }

  return (
    <img
      src={photoUrl}
      alt={alt}
      onError={() => setFailed(true)}
    />
  )
}

export default MemberList