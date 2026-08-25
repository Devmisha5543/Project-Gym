function MemberList({ members }) {
  return (
    <ul>
      {members.map(member => (
        <li key={member.member_id}>
          {member.name} — {member.phone}
        </li>
      ))}
    </ul>
  )
}

export default MemberList