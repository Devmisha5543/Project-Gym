import { useState, useEffect } from 'react'
import { API_URL } from './config'
import BranchList from './BranchList'
import BranchForm from './BranchForm'

function BranchPage() {
  const [branches, setBranches] = useState([])

  function loadBranches() {
    fetch(`${API_URL}/branches`)
      .then(response => response.json())
      .then(data => setBranches(data))
  }

  useEffect(() => {
    loadBranches()
  }, [])

  return (
    <div>
      <h1>Branches</h1>
      <BranchForm onBranchCreated={loadBranches} />
      <BranchList branches={branches} />
    </div>
  )
}

export default BranchPage
