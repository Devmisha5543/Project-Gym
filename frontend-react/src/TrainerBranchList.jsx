import { API_URL } from './config'
function TrainerBranchList({ trainerBranches, onTrainerBranchDeleted }) {
  function handleDelete(assignment) {
    fetch(`${API_URL}/trainerbranch/${assignment.trainer_id}/${assignment.branch_id}`, {
      method: "DELETE"
    })
      .then(response => response.json())
      .then(() => onTrainerBranchDeleted())
  }

  return (
    <ul>
      {trainerBranches.map(assignment => (
        <li key={`${assignment.trainer_id}-${assignment.branch_id}`}>
          Trainer {assignment.trainer_id} - Branch {assignment.branch_id}
          {' '}
          <button type="button" onClick={() => handleDelete(assignment)}>Delete</button>
        </li>
      ))}
    </ul>
  )
}

export default TrainerBranchList
