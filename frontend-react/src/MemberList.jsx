import { UserRound } from 'lucide-react'
import { useState } from 'react'
import { API_URL } from './config'
import MemberDetail from './MemberDetail'

function MemberList({ members, branches, onMemberUpdated, onMemberDeleted, onFeedback }) {
  const [selectedMember, setSelectedMember] = useState(null)

  if (members.length === 0) {
    return (
      <div className="empty-members">
        <div className="empty-icon">
          <UserRound size={32} />
        </div>
        <h3>No members found</h3>
        <p>Try changing your search or branch filter.</p>
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
    return (
      branches?.find(branch => String(branch.branch_id) === String(member.branch_id))?.name ||
      (member.branch_id ? `Branch ${member.branch_id}` : '—')
    )
  }
 function formatDate(value) {
   if (!value) return '—'

   const date = new Date(value)

   if (Number.isNaN(date.getTime())) {

    return value
  }

  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

  return (
    <>
      <div className="members-table-container">
        <table className="members-table">
          <thead>
            <tr>
              <th className="th-name">Name</th>
              <th className="th-gender">Gender</th>
              <th className="th-phone">Phone</th>
              <th className="th-branch">Branch</th>
              <th className="th-address">Address</th>
              <th className="th-joined">Joined Date</th>
              <th className="th-trainer">Personal Trainer</th>
              <th className="th-status">Status</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr
                key={member.member_id}
                className="member-table-row"
                onClick={() => setSelectedMember(member)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    setSelectedMember(member)
                  }
                }}
                aria-label={`View details for ${member.name}`}
              >
                <td className="td-name">
                  <div className="member-name-cell">
                    <div className="member-avatar-mini">
                      <MemberPhoto
                        key={getPhotoUrl(member) || 'avatar-mini'}
                        member={member}
                        photoUrl={getPhotoUrl(member)}
                        alt={member.name}
                      />
                    </div>
                    <strong className="member-table-name">{member.name}</strong>
                  </div>
                </td>
                <td className="td-gender">{member.gender || '—'}</td>
                <td className="td-phone">{member.phone || '—'}</td>
                <td className="td-branch">{getBranchName(member)}</td>
                <td className="td-address">{member.address || '—'}</td>
                <td className="td-joined">{formatDate(member.join_date)}</td>
                <td className="td-trainer">{member.wants_trainer ? 'Yes' : 'No'}</td>
                <td className="td-status">
                  <span className="member-status-badge">Active</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedMember && (
        <div
          className="member-detail-modal"
          role="dialog"
          aria-modal="true"
          aria-label={`${selectedMember.name} details`}
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedMember(null)
          }}
        >
          <div className="member-detail-modal-panel">
            <MemberDetail
              member={selectedMember}
              branches={branches}
              onMemberUpdated={updated => {
                setSelectedMember(updated)
                onMemberUpdated?.(updated)
              }}
              onMemberDeleted={memberId => {
                setSelectedMember(null)
                onMemberDeleted?.(memberId)
              }}
              onClose={() => setSelectedMember(null)}
              onFeedback={onFeedback}
            />
          </div>
        </div>
      )}
    </>
  )
}

function MemberPhoto({ member, photoUrl, alt }) {
  const [failed, setFailed] = useState(false)

  if (!photoUrl || failed) {
    return <span>{member.name?.charAt(0).toUpperCase() || '?'}</span>
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