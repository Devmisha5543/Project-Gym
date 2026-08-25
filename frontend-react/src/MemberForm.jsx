import { useState, useEffect } from 'react'

function MemberForm({ onMemberCreated }) {
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState('')
  const [name, setName] = useState('')
  const [gender, setGender] = useState('')
  const [phone, setPhone] = useState('')
  const [address, setAddress] = useState('')
  const [joinDate, setJoinDate] = useState(new Date().toISOString().split('T')[0])
  const [wantsTrainer, setWantsTrainer] = useState(false)
  const [photo, setPhoto] = useState(null)

  useEffect(() => {
    fetch("http://127.0.0.1:5000/branches")
      .then(response => response.json())
      .then(data => setBranches(data))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const formData = new FormData()
    formData.append("branch_id", branchId)
    formData.append("name", name)
    formData.append("gender", gender)
    formData.append("phone", phone)
    formData.append("address", address)
    formData.append("join_date", joinDate)
    formData.append("wants_trainer", wantsTrainer)
    if (photo) {
      formData.append("photo", photo)
    }

    fetch("http://127.0.0.1:5000/members", {
      method: "POST",
      body: formData
    })
      .then(response => response.json())
      .then(() => {
        setName('')
        setGender('')
        setPhone('')
        setAddress('')
        setWantsTrainer(false)
        setPhoto(null)
        onMemberCreated()
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Branch:</label>
      <select value={branchId} onChange={e => setBranchId(e.target.value)} required>
        <option value="">-- Select a branch --</option>
        {branches.map(branch => (
          <option key={branch.branch_id} value={branch.branch_id}>
            {branch.name}
          </option>
        ))}
      </select>
      <br /><br />

      <label>Name:</label>
      <input type="text" value={name} onChange={e => setName(e.target.value)} required />
      <br /><br />

      <label>Gender:</label>
      <select value={gender} onChange={e => setGender(e.target.value)} required>
        <option value="">-- Select --</option>
        <option value="Male">Male</option>
        <option value="Female">Female</option>
      </select>
      <br /><br />

      <label>Phone:</label>
      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required />
      <br /><br />

      <label>Address:</label>
      <input type="text" value={address} onChange={e => setAddress(e.target.value)} required />
      <br /><br />

      <label>Join Date:</label>
      <input type="date" value={joinDate} onChange={e => setJoinDate(e.target.value)} required />
      <br /><br />

      <label>Wants a Trainer?</label>
      <input type="checkbox" checked={wantsTrainer} onChange={e => setWantsTrainer(e.target.checked)} />
      <br /><br />

      <label>Photo:</label>
      <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files[0])} />
      <br /><br />

      <button type="submit">Add Member</button>
    </form>
  )
}

export default MemberForm