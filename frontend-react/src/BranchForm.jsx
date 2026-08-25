import { useState } from 'react'

function BranchForm({ onBranchCreated }) {
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [phone, setPhone] = useState('')
  const [city, setCity] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const newBranch = { name, address, phone, city }

    fetch("http://127.0.0.1:5000/branches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newBranch)
    })
      .then(response => response.json())
      .then(() => {
        setName('')
        setAddress('')
        setPhone('')
        setCity('')
        onBranchCreated()
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Name:</label>
      <input type="text" value={name} onChange={e => setName(e.target.value)} required />
      <br /><br />

      <label>Address:</label>
      <input type="text" value={address} onChange={e => setAddress(e.target.value)} required />
      <br /><br />

      <label>Phone:</label>
      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required />
      <br /><br />

      <label>City:</label>
      <input type="text" value={city} onChange={e => setCity(e.target.value)} required />
      <br /><br />

      <button type="submit">Add Branch</button>
    </form>
  )
}

export default BranchForm
