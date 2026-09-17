import {
  UserRound,
  Phone,
  MapPin,
  CalendarDays,
  Eye,
  Pencil,
  Trash2
} from 'lucide-react'

function MemberList({ members, onView, onEdit, onDelete }) {

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

  return (
    <div className="members-grid">

      {members.map((member, index) => (

        <div
          className="member-card"
          key={member.member_id}
          style={{
            animationDelay: `${index * 50}ms`
          }}
        >

          {/* Avatar */}
          <div className="member-avatar">

            {member.photo ? (
              <img
                src={member.photo}
                alt={member.name}
              />
            ) : (
              <span>
                {member.name?.charAt(0).toUpperCase()}
              </span>
            )}

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

          {/* Actions */}
          <div className="member-actions">

            <button
              type="button"
              className="member-action view-action"
              title="View member"
              onClick={() => onView?.(member)}
            >
              <Eye size={17} />
              <span>View</span>
            </button>

            <button
              type="button"
              className="member-action edit-action"
              title="Edit member"
              onClick={() => onEdit?.(member)}
            >
              <Pencil size={17} />
              <span>Edit</span>
            </button>

            <button
              type="button"
              className="member-action delete-action"
              title="Delete member"
              onClick={() => onDelete?.(member)}
            >
              <Trash2 size={17} />
              <span>Delete</span>
            </button>

          </div>

        </div>

      ))}

    </div>
  )
}

export default MemberList