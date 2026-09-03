import { API_URL } from './config'
function MembershipList({ memberships }) {
  return (
    <ul>
      {memberships.map(membership => (
        <li key={membership.membership_id}>
          Membership #{membership.membership_id} - Member {membership.member_id} - Plan {membership.plan_id} - {membership.start_date} to {membership.end_date} - {membership.status}
        </li>
      ))}
    </ul>
  )
}

export default MembershipList
