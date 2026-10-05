import {
  UserRound,
  Phone,
  MapPin,
  CalendarDays,
  Pencil,
  Trash2,
  X,
  Save,
  UserRoundCheck,
  CreditCard
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { memberSchema } from './schemas'
import MemberPhoto from './MemberPhoto'
import { useTranslation } from 'react-i18next'

function MemberDetail({
  member,
  branches,
  membership,
  onMemberUpdated,
  onMemberDeleted,
  onRenew,
  onFeedback,
  onClose
}) {
  const { t } = useTranslation('members')
  const [editing, setEditing] = useState(false)
  const [deletePending, setDeletePending] = useState(false)
  const [editValues, setEditValues] = useState({})
  const [newPhoto, setNewPhoto] = useState(null)
  const [newPhotoPreview, setNewPhotoPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [photoPreviewOpen, setPhotoPreviewOpen] = useState(false)

  useEffect(() => {
    if (!onClose) return undefined

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setPhotoPreviewOpen(false)
        onClose()
      }
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
            throw new Error(t('updateMemberFailed'))
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
        onFeedback?.('members:updateMemberFailed', 'error')
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
            throw new Error(data.error || t('deleteMemberFailed'))
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
        onFeedback?.(error.message || t('deleteMemberFailed'), 'error')
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
        <button
          type="button"
          className="member-avatar member-avatar-large member-profile-photo-button"
          onClick={() => photoUrl && setPhotoPreviewOpen(true)}
          disabled={!photoUrl}
          aria-label={t('viewMemberProfilePhoto', { name: member.name })}
        >
          <MemberPhoto key={photoUrl || 'member-profile'} member={member} photoUrl={photoUrl} alt={member.name} />
        </button>
        <div>
          <span className="member-detail-label">{t('memberProfile')}</span>
          <h4>{editing ? editValues.name : member.name}</h4>
        </div>
        {onClose && (
          <button type="button" className="member-detail-close" onClick={onClose} aria-label={t('closeDetails')}>
            <X size={19} />
          </button>
        )}
      </div>

      {editing ? (
        <div className="member-edit-fields">
          <label>{t('fullName')}<input value={editValues.name} onChange={event => updateEditValue('name', event.target.value)} /></label>
          <label>{t('common:phone')}<input value={editValues.phone} onChange={event => updateEditValue('phone', event.target.value)} /></label>
          <label>{t('gender')}<select value={editValues.gender} onChange={event => updateEditValue('gender', event.target.value)}><option value="">{t('selectGender')}</option><option value="Male">{t('male')}</option><option value="Female">{t('female')}</option></select></label>
          <label>{t('branch')}<select value={editValues.branch_id} onChange={event => updateEditValue('branch_id', event.target.value)}><option value="">{t('people:selectBranch')}</option>{branches?.map(branch => <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>)}</select></label>
          <label>{t('common:address')}<input value={editValues.address} onChange={event => updateEditValue('address', event.target.value)} /></label>
          <label>{t('joinDate')}<input type="date" value={editValues.join_date} onChange={event => updateEditValue('join_date', event.target.value)} /></label>
          <label className="member-edit-checkbox"><input type="checkbox" checked={editValues.wants_trainer} onChange={event => updateEditValue('wants_trainer', event.target.checked)} />{t('wantsPersonalTrainer')}</label>
          <div className="member-photo-edit">
            <span>{t('currentPhoto')}</span>
            <div className="member-photo-edit-row">
              <div className="member-avatar member-avatar-small"><MemberPhoto key={photoUrl || 'member-edit-photo'} member={member} photoUrl={photoUrl} alt="Member preview" /></div>
              <label className="member-upload-button"><span>{newPhoto ? 'Replace Photo' : 'Change Photo'}</span><input type="file" accept="image/*" onChange={handlePhotoChange} /></label>
              {newPhoto && <button type="button" className="member-action secondary-action" onClick={() => { setNewPhoto(null); setNewPhotoPreview(null) }}><X size={16} /> {t('removeSelection')}</button>}
            </div>
          </div>
        </div>
      ) : (
        <div className="member-expanded-details">
          <div><UserRound size={15} /><span>{t('fullName')}<strong>{member.name}</strong></span></div>
          <div><Phone size={15} /><span>{t('common:phone')}<strong>{member.phone || t('notProvided')}</strong></span></div>
          <div><UserRoundCheck size={15} /><span>{t('gender')}<strong>{member.gender ? t(member.gender.toLowerCase()) : t('notProvided')}</strong></span></div>
          <div><MapPin size={15} /><span>{t('branch')}<strong>{getBranchName()}</strong></span></div>
          <div><MapPin size={15} /><span>{t('common:address')}<strong>{member.address || t('notProvided')}</strong></span></div>
          <div><CalendarDays size={15} /><span>{t('joinDate')}<strong>{member.join_date || t('notProvided')}</strong></span></div>
          <div><UserRoundCheck size={15} /><span>{t('personalTrainer')}<strong>{member.wants_trainer ? t('yes') : t('no')}</strong></span></div>
          <div><UserRoundCheck size={15} /><span>{t('common:status')}<strong>{membership?.status ? t(`status.${membership.status}`) : t('active')}</strong></span></div>
          {membership && <MembershipDetails membership={membership} />}
        </div>
      )}

      <div className="member-expanded-actions">
        {!editing && membership && getRemainingDays(membership.end_date) < 0 && onRenew && (
          <button type="button" className="member-action edit-action" onClick={onRenew}><CreditCard size={16} /> {t('renewShort')}</button>
        )}
        {editing ? (
          <>
            <button type="button" className="member-action edit-action" onClick={saveMember} disabled={saving || !editValues.name || !editValues.phone}><Save size={16} /> {t('saveChanges')}</button>
            <button type="button" className="member-action secondary-action" onClick={cancelEditing} disabled={saving}><X size={16} /> {t('common:cancel')}</button>
          </>
        ) : (
          <button type="button" className="member-action edit-action" onClick={startEditing}><Pencil size={16} /> {t('editMember')}</button>
        )}
        <button type="button" className="member-action delete-action" onClick={() => setDeletePending(true)}><Trash2 size={16} /> {t('deleteMember')}</button>
      </div>

      {deletePending && (
        <div className="member-delete-confirmation">
          <strong>{t('deleteConfirm')}</strong>
          <span>{t('deleteWarning')}</span>
          <div className="member-confirmation-actions">
            <button type="button" className="member-action secondary-action" onClick={() => setDeletePending(false)} disabled={deleting}>{t('common:cancel')}</button>
            <button type="button" className="member-action delete-action" onClick={confirmDelete} disabled={deleting}>{t('common:delete')}</button>
          </div>
        </div>
      )}

      {photoPreviewOpen && (
        <div className="member-photo-preview" role="dialog" aria-modal="true" aria-label={t('memberPhotoProfile', { name: member.name })} onClick={() => setPhotoPreviewOpen(false)}>
          <button type="button" className="member-photo-preview-close" onClick={() => setPhotoPreviewOpen(false)} aria-label={t('common:close')}><X size={20} /></button>
          <MemberPhoto key={`large-${photoUrl}`} member={member} photoUrl={photoUrl} alt={member.name} />
        </div>
      )}
    </div>
  )
}

function MembershipDetails({ membership }) {
  const { t } = useTranslation('members')
  const remainingDays = getRemainingDays(membership.end_date)

  return (
    <div className="membership-detail-block">
      <div><CreditCard size={15} /><span>{t('membershipPlanLabel')}<strong>{membership.plan_name || t('notProvided')}</strong></span></div>
      <div><CalendarDays size={15} /><span>{t('membershipStart')}<strong>{membership.start_date || t('notProvided')}</strong></span></div>
      <div><CalendarDays size={15} /><span>{t('membershipExpiration')}<strong>{membership.end_date || t('notProvided')}</strong></span></div>
      <div><UserRoundCheck size={15} /><span>{t('membershipStatus')}<strong>{remainingDays < 0 ? t('expiredMembership') : membership.status ? t(`status.${membership.status}`) : t('notProvided')}</strong></span></div>
      <div><CalendarDays size={15} /><span>{t('remainingDays')}<strong>{remainingDays === null ? t('notAvailable') : remainingDays < 0 ? t('membershipExpired') : remainingDays}</strong></span></div>
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

export default MemberDetail
