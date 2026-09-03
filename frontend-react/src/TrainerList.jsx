import { API_URL } from './config'
function TrainerList({ trainers }) {
  return (
    <ul>
      {trainers.map(trainer => (
        <li key={trainer.trainer_id}>
          {trainer.name} - {trainer.phone}
        </li>
      ))}
    </ul>
  )
}

export default TrainerList
