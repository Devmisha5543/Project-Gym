import {
  UserRound,
  Phone,
  MapPin,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Save,
  UserRoundCheck
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { memberSchema } from './schemas'

function MemberDetail({
  member,
  branches,
  membership,
  onMemberUpdated,
  onMemberDeleted,
  onFeedback,
  onClose
}) {
  const [editing, setEditing] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [editValues, setEditValues] = useState({})
  const [newPhoto, setNewPhoto] = useState(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!onClose) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  function getPhotoUrl() {
    const photo = member.photo_filename || member.photo
    if (!photo) return null

    if (/^(https?:|data:|blob:)/i.test(photo)) return photo
    if (photo.startsWith('/')) return `${API_URL}${photo}`

    return `${API_URL}/uploads/${encodeURIComponent(photo)}`
  }

  function getBranchName() {
    return branches?.find(branch => (
      String(branch.branch_id) === String(member.branch_id)
    ))?.name || `Branch ${member.branch_id}`
  }

  function startEditing() {
    setEditing(true)
    setDeletePending(false)
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
    setEditing(false)
    setNewPhoto(null)
    setNewPhotoPreview(null)
  }

  function saveMember() {
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
      .then(response => (
        response.json().catch(() => ({})).then(data => {
          if (!response.ok) {
            throw new Error(data.error || 'Failed to update member')
          }

          return data
        })
      ))
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

  function confirmDelete() {
    setDeleting(true)

    authFetch(`${API_URL}/members/${member.member_id}`, {
      method: 'DELETE'
    })
      .then(response => (
        response.json().catch(() => ({})).then(data => {
          if (!response.ok) {
            throw new Error(data.error || 'Failed to delete member')
          }

          return data
        })
      ))
      .then(() => {
        onMemberDeleted?.(member.member_id)
        onFeedback?.('Member deleted successfully.', 'success')
        onClose?.()
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

  const photoUrl = newPhotoPreview || getPhotoUrl()

  return (
    <div className="member-detail-content">
      <div className="member-profile-heading">
        <div className="member-avatar member-avatar-large">
          <MemberPhoto key={photoUrl || 'member-profile'} member={member} photoUrl={photoUrl} alt={member.name} />
        </div>
        <div>
          <span className="member-detail-label">Member profile</span>
          <h4>{editing ? editValues.name : member.name}</h4>
        </div>
        {onClose && (
          <button type="button" className="member-detail-close" onClick={onClose} aria-label="Close member details">
            <X size={19} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="member-edit-fields">
          <label>Full name<input value={editValues.name} onChange={event => updateEditValue('name', event.target.value)} /></label>
          <label>Phone<input value={editValues.phone} onChange={event => updateEditValue('phone', event.target.value)} /></label>
          <label>Gender<select value={editValues.gender} onChange={event => updateEditValue('gender', event.target.value)}><option value="">Select gender</option><option value="Male">Male</option><option value="Female">Female</option></select></label>
          <label>Branch<select value={editValues.branch_id} onChange={event => updateEditValue('branch_id', event.target.value)}><option value="">Select a branch</option>{branches?.map(branch => <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>)}</select></label>
          <label>Address<input value={editValues.address} onChange={event => updateEditValue('address', event.target.value)} /></label>
          <label>Join Date<input type="date" value={editValues.join_date} onChange={event => updateEditValue('join_date', event.target.value)} /></label>
          <label className="member-edit-checkbox"><input type="checkbox" checked={editValues.wants_trainer} onChange={event => updateEditValue('wants_trainer', event.target.checked)} />Member wants a personal trainer</label>
          <div className="member-photo-edit">
            <span>Current Photo</span>
            <div className="member-photo-edit-row">
              <div className="member-avatar member-avatar-small"><MemberPhoto key={photoUrl || 'member-edit-photo'} member={member} photoUrl={photoUrl} alt="Member preview" /></div>
              <label className="member-upload-button"><span>{newPhoto ? 'Replace Photo' : 'Change Photo'}</span><input type="file" accept="image/*" onChange={handlePhotoChange} /></label>
              {newPhoto && <button type="button" className="member-action secondary-action" onClick={() => { setNewPhoto(null); setNewPhotoPreview(null) }}><X size={16} /> Remove selection</button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="member-expanded-details">
          <div><UserRound size={15} /><span>Full name<strong>{member.name}</strong></span></div>
          <div><Phone size={15} /><span>Phone<strong>{member.phone || 'Not provided'}</strong></span></div>
          <div><UserRoundCheck size={15} /><span>Gender<strong>{member.gender || 'Not provided'}</strong></span></div>
          <div><MapPin size={15} /><span>Branch<strong>{getBranchName()}</strong></span></div>
          <div><MapPin size={15} /><span>Address<strong>{member.address || 'Not provided'}</strong></span></div>
          <div><CalendarDays size={15} /><span>Join date<strong>{member.join_date || 'Not provided'}</strong></span></div>
          <div><UserRoundCheck size={15} /><span>Personal trainer<strong>{member.wants_trainer ? 'Yes' : 'No'}</strong></span></div>
          <div><UserRoundCheck size={15} /><span>Status<strong>{membership?.status || 'Active'}</strong></span></div>
          {membership && <MembershipDetails membership={membership} />}
        </div>
      )}

      <div className="member-expanded-actions">
        {editing ? (
          <>
            <button type="button" className="member-action edit-action" onClick={saveMember} disabled={saving || !editValues.name || !editValues.phone}><Save size={16} /> Save Changes</button>
            <button type="button" className="member-action secondary-action" onClick={cancelEditing} disabled={saving}><X size={16} /> Cancel</button>
          </>
        ) : (
          <button type="button" className="member-action edit-action" onClick={startEditing}><Pencil size={16} /> Edit Member</button>
        )}
        <button type="button" className="member-action delete-action" onClick={() => setDeletePending(true)}><Trash2 size={16} /> Delete</button>
      </div>

      {deletePending && (
        <div className="member-delete-confirmation">
          <strong>Are you sure you want to delete this member?</strong>
          <span>This action cannot be undone.</span>
          <div className="member-confirmation-actions">
            <button type="button" className="member-action secondary-action" onClick={() => setDeletePending(false)} disabled={deleting}>Cancel</button>
            <button type="button" className="member-action delete-action" onClick={confirmDelete} disabled={deleting}>Delete</button>
          </div>
        </div>
      )}
    </div>
  )
}

function MembershipDetails({ membership }) {
  const remainingDays = getRemainingDays(membership.end_date)

  return (
    <div className="membership-detail-block">
      <div><CalendarDays size={15} /><span>Membership start<strong>{membership.start_date || 'Not provided'}</strong></span></div>
      <div><CalendarDays size={15} /><span>Membership expiration<strong>{membership.end_date || 'Not provided'}</strong></span></div>
      <div><UserRoundCheck size={15} /><span>Membership status<strong>{membership.status || 'Not provided'}</strong></span></div>
      <div><CalendarDays size={15} /><span>Remaining days<strong>{remainingDays === null ? 'Not available' : remainingDays}</strong></span></div>
    </div>
  )
}

function getRemainingDays(endDate) {
  if (!endDate) return null

  const expiry = new Date(`${endDate}T00:00:00`)
  if (Number.isNaN(expiry.getTime())) return null

  const today = new Date()
  const currentDate = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  return Math.ceil((expiry - currentDate) / 86400000)
}

function toDateInputValue(value) {
  if (!value) return ''

  const valueText = String(value)
  if (/^\d{4}-\d{2}-\d{2}$/.test(valueText)) return valueText

  const parsedDate = new Date(valueText)
  return Number.isNaN(parsedDate.getTime()) ? '' : parsedDate.toISOString().slice(0, 10)
}

function MemberPhoto({ member, photoUrl, alt }) {
  const [failed, setFailed] = useState(false)

  if (!photoUrl || failed) {
    return <span>{member.name?.charAt(0).toUpperCase()}</span>
  }

  return <img src={photoUrl} alt={alt} onError={() => setFailed(true)} />
}

export default MemberDetail
