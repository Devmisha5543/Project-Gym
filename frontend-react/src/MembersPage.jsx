import { useState, useEffect } from 'react'
import { API_URL } from './config'
import MemberList from './MemberList'
import MemberForm from './MemberForm'

function MembersPage() {
  const [members, setMembers] = useState([])

  function loadMembers() {
    fetch(`${API_URL}/members`)
      .then(response => response.json())
      .then(data => setMembers(data))
  }

  useEffect(() => {
    loadMembers()
  }, [])

  return (
    <div>
      <h1>Members</h1>
      <MemberForm onMemberCreated={loadMembers} />
      <MemberList members={members} />
    </div>
  )
}

export default MembersPage
