import { Activity, CalendarDays, Dumbbell, UserRound } from 'lucide-react'

function PersonalTrainingAssignmentList({ personalTrainingAssignments }) {
  if (personalTrainingAssignments.length === 0) {
    return (
      <div className="pt-assignment-state pt-assignment-empty-state">
        <div className="pt-assignment-state-icon">
          <Activity size={25} />
        </div>
        <h3>No personal training assignments</h3>
        <p>Create an assignment above to connect a member with a trainer.</p>
      </div>
    )
  }

  return (
    <div className="pt-assignment-list">
      {personalTrainingAssignments.map(assignment => (
        <article className="pt-assignment-card" key={assignment.assignment_id}>
          <div className="pt-assignment-card-icon">
            <Activity size={20} />
          </div>
          <div className="pt-assignment-card-main">
            <div className="pt-assignment-card-title-row">
              <div>
                <span className="pt-assignment-card-label">Assignment #{assignment.assignment_id}</span>
                <h2>{assignment.speciality}</h2>
              </div>
              <span className={`pt-assignment-status pt-assignment-status-${String(assignment.status || 'unknown').toLowerCase()}`}>
                {assignment.status || 'Status unavailable'}
              </span>
            </div>

            <div className="pt-assignment-card-meta">
              <span><Dumbbell size={15} />Trainer #{assignment.trainer_id}</span>
              <span><UserRound size={15} />Member #{assignment.member_id}</span>
              <span><CalendarDays size={15} />Starts {assignment.start_date}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default PersonalTrainingAssignmentList
