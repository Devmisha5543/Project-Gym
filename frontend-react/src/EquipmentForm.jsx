import { useState, useEffect } from 'react'
import { equipmentSchema } from './schemas'
import { API_URL } from './config'

function EquipmentForm({ onEquipmentCreated }) {
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [condition, setCondition] = useState('')
  const [errors, setErrors] = useState({})

  useEffect(() => {
    fetch(`${API_URL}/branches`)
      .then(response => response.json())
      .then(data => setBranches(data))
  }, [])

  function handleSubmit(event) {
    event.preventDefault()

    const result = equipmentSchema.safeParse({ branchId, name, quantity })
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const newEquipment = {
      branch_id: branchId,
      name,
      quantity,
      condition
    }

    fetch(`${API_URL}/equipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEquipment)
    })
      .then(response => response.json())
      .then(() => {
        setBranchId('')
        setName('')
        setQuantity('')
        setCondition('')
        onEquipmentCreated()
      })
  }

  return (
    <form onSubmit={handleSubmit}>
      <label>Branch:</label>
      <select value={branchId} onChange={e => setBranchId(e.target.value)} required>
        <option value="">-- Select a branch</option>
        {branches.map(branch => (
          <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>
        ))}
      </select>
      {errors.branchId && <p style={{ color: '#dc2626' }}>{errors.branchId}</p>}
      <br /><br />

      <label>Name:</label>
      <input type="text" value={name} onChange={e => setName(e.target.value)} required />
      {errors.name && <p style={{ color: '#dc2626' }}>{errors.name}</p>}
      <br /><br />

      <label>Quantity:</label>
      <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required />
      {errors.quantity && <p style={{ color: '#dc2626' }}>{errors.quantity}</p>}
      <br /><br />

      <label>Condition:</label>
      <input type="text" value={condition} onChange={e => setCondition(e.target.value)} required />
      <br /><br />

      <button type="submit">Add Equipment</button>
    </form>
  )
}

export default EquipmentForm
