import { API_URL } from './config'
import { authFetch } from './authFetch'
import { GitBranch, MapPin, Trash2, UserRound } from 'lucide-react'
function TrainerBranchList({ trainerBranches, onTrainerBranchDeleted }) {
  function handleDelete(assignment) {
    authFetch(`${API_URL}/trainerbranch/${assignment.trainer_id}/${assignment.branch_id}`, {
      method: "DELETE"
    })
      .then(response => response.json())
      .then(() => onTrainerBranchDeleted())
  }

  if (trainerBranches.length === 0) return <div className="trainer-branch-state"><div className="trainer-branch-state-icon"><GitBranch size={25} /></div><h3>No trainer branch links</h3><p>Create a relationship above to connect a trainer and branch.</p></div>
  return (
    <div className="trainer-branch-list">
      {trainerBranches.map(assignment => (
        <article className="trainer-branch-card" key={`${assignment.trainer_id}-${assignment.branch_id}`}><div className="trainer-branch-card-icon"><GitBranch size={20} /></div><div className="trainer-branch-card-main"><span className="trainer-branch-card-label">Trainer Branch Link</span><h2>Trainer #{assignment.trainer_id}</h2><div className="trainer-branch-card-meta"><span><UserRound size={15} />Trainer #{assignment.trainer_id}</span><span><MapPin size={15} />Branch #{assignment.branch_id}</span></div></div><button className="trainer-branch-delete" type="button" onClick={() => handleDelete(assignment)} title="Delete trainer branch link"><Trash2 size={16} /><span>Delete</span></button></article>
      ))}
    </div>
  )
}

export default TrainerBranchList
