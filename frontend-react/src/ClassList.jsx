import { CalendarDays, Clock3, Dumbbell, MapPin, Users } from 'lucide-react'

function ClassList({ classes }) {
  if (classes.length === 0) {
    return (
      <div className="class-state class-empty-state">
        <div className="class-state-icon">
          <CalendarDays size={25} />
        </div>
        <h3>No classes scheduled</h3>
        <p>Create your first class above to build the schedule.</p>
      </div>
    )
  }

  return (
    <div className="class-list">
      {classes.map(gymClass => (
        <article className="class-card" key={gymClass.class_id}>
          <div className="class-card-icon">
            <Dumbbell size={20} />
          </div>
          <div className="class-card-main">
            <div className="class-card-title-row">
              <div>
                <span className="class-card-label">Class #{gymClass.class_id}</span>
                <h2>{gymClass.class_name}</h2>
              </div>
            </div>

            <div className="class-card-details">
              <span><CalendarDays size={15} />{gymClass.schedule_time}</span>
              <span><Clock3 size={15} />{gymClass.duration_minutes} minutes</span>
              <span><Users size={15} />Capacity {gymClass.capacity}</span>
              <span><Users size={15} />Trainer #{gymClass.trainer_id}</span>
              <span><MapPin size={15} />Branch #{gymClass.branch_id}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default ClassList
