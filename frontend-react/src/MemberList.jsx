import { UserRound } from 'lucide-react'
import { useState } from 'react'
import { API_URL } from './config'
import MemberDetail from './MemberDetail'
import MemberPhoto from './MemberPhoto'
import { useTranslation } from 'react-i18next'

function MemberList({ members, memberships = [], branches, onMemberUpdated, onMemberDeleted, onFeedback, onRenew }) {
  const { t } = useTranslation('members')
  const [selectedMember, setSelectedMember] = useState(null)

  if (members.length === 0) {
    return (
      <div className="empty-members">
        <div className="empty-icon">
          <UserRound size={32} />
        </div>
        <h3>{t('noMembers')}</h3>
        <p>{t('tryChangeSearch')}</p>
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
              <th className="th-name">{t('common:name')}</th>
              <th className="th-gender">{t('gender')}</th>
              <th className="th-phone">{t('common:phone')}</th>
              <th className="th-branch">{t('branch')}</th>
              <th className="th-address">{t('common:address')}</th>
              <th className="th-joined">{t('joinedDate')}</th>
              <th className="th-trainer">{t('personalTrainer')}</th>
              <th className="th-status">{t('common:status')}</th>
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
                aria-label={t('viewMemberProfilePhoto', { name: member.name })}
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
                  <span className="member-status-badge">{t('active')}</span>
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
          aria-label={t('memberPhotoProfile', { name: selectedMember.name })}
          onClick={e => {
            if (e.target === e.currentTarget) setSelectedMember(null)
          }}
        >
          <div className="member-detail-modal-panel">
            <MemberDetail
              member={selectedMember}
              membership={memberships
                .filter(item => String(item.member_id) === String(selectedMember.member_id))
                .sort((a, b) => String(b.end_date || '').localeCompare(String(a.end_date || '')) || Number(b.membership_id) - Number(a.membership_id))[0]}
              branches={branches}
              onRenew={() => {
                const membership = memberships
                  .filter(item => String(item.member_id) === String(selectedMember.member_id))
                  .sort((a, b) => String(b.end_date || '').localeCompare(String(a.end_date || '')) || Number(b.membership_id) - Number(a.membership_id))[0]
                if (membership) onRenew?.(membership)
              }}
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

export default MemberList
