import { Building2, MapPin, Phone } from 'lucide-react'

function BranchList({ branches }) {
  if (branches.length === 0) {
    return (
      <div className="branch-state branch-empty-state">
        <div className="branch-state-icon">
          <Building2 size={25} />
        </div>
        <h3>No branches yet</h3>
        <p>Add your first gym location above to get started.</p>
      </div>
    )
  }

  return (
    <div className="branch-list">
      {branches.map(branch => (
        <article className="branch-card" key={branch.branch_id}>
          <div className="branch-card-icon">
            <Building2 size={20} />
          </div>
          <div className="branch-card-main">
            <div className="branch-card-title-row">
              <div>
                <span className="branch-card-label">Branch #{branch.branch_id}</span>
                <h2>{branch.name}</h2>
              </div>
              <span className="branch-status">Operational</span>
            </div>
            <div className="branch-card-details">
              <span><MapPin size={15} />{branch.address || 'Address not provided'}{branch.city ? `, ${branch.city}` : ''}</span>
              <span><Phone size={15} />{branch.phone || 'Phone not provided'}</span>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

export default BranchList
