import { Award, Mail, Phone, UserRound } from 'lucide-react'

function TrainerList({ trainers }) {
  if (trainers.length === 0) {
    return (
      <div className="trainer-state trainer-empty-state">
        <div className="trainer-state-icon">
          <UserRound size={25} />
        </div>
        <h3>No trainers yet</h3>
        <p>Add your first coach above to build your training team.</p>
      </div>
    )
  }

  return (
    <div className="trainer-list">
      {trainers.map(trainer => (
        <article className="trainer-card" key={trainer.trainer_id}>
          <div className="trainer-card-avatar">
            <UserRound size={22} />
          </div>
          <div className="trainer-card-main">
            <div className="trainer-card-title-row">
              <div>
                <span className="trainer-card-label">Trainer #{trainer.trainer_id}</span>
                <h2>{trainer.name}</h2>
              </div>
            </div>
            <div className="trainer-card-details">
              <span><Phone size={15} />{trainer.phone}</span>
              <span><Mail size={15} />{trainer.email}</span>
              <span><Award size={15} />{trainer.certification}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default TrainerList
