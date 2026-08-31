import { useState, useEffect } from 'react'
import MembershipList from './MembershipList'
import MembershipForm from './MembershipForm'

function MembershipPage() {
  const [memberships, setMemberships] = useState([])

  function loadMemberships() {
    fetch("http://127.0.0.1:5000/memberships")
      .then(response => response.json())
      .then(data => setMemberships(data))
  }

  useEffect(() => {
    loadMemberships()
  }, [])

  return (
    <div>
      <h1>Memberships</h1>
      <MembershipForm onMembershipCreated={loadMemberships} />
      <MembershipList memberships={memberships} />
    </div>
  )
}

export default MembershipPage
