import { useState } from 'react'

function TrainerForm({ onTrainerCreated }) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [certification, setCertification] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    const newTrainer = { name, phone, email, certification }

    fetch("http://127.0.0.1:5000/trainers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newTrainer)
    })
      .then(response => response.json())
      .then(() => {
        setName('')
        setPhone('')
        setEmail('')
        setCertification('')
        onTrainerCreated()
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Name:</label>
      <input type="text" value={name} onChange={e => setName(e.target.value)} required />
      <br /><br />

      <label>Phone:</label>
      <input type="text" value={phone} onChange={e => setPhone(e.target.value)} required />
      <br /><br />

      <label>Email:</label>
      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required />
      <br /><br />

      <label>Certificate:</label>
      <input type="text" value={certification} onChange={e => setCertification(e.target.value)} required />
      <br /><br />

      <button type="submit">Add Trainer</button>
    </form>
  )
}

export default TrainerForm
