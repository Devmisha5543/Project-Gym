import { API_URL } from './config'
function BranchList({ branches }) {
  return (
    <ul>
      {branches.map(branch => (
        <li key={branch.branch_id}>
          {branch.name} - {branch.city}
        </li>
      ))}
    </ul>
  )
}

export default BranchList
