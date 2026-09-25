import { useState, useEffect } from 'react'
import { equipmentSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { Boxes, MapPin, Save, ShieldCheck } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function EquipmentForm({ onEquipmentCreated }) {
  const [branches, setBranches] = useState([])
  const [branchId, setBranchId] = useState('')
  const [name, setName] = useState('')
  const [quantity, setQuantity] = useState('')
  const [condition, setCondition] = useState('')
  const [errors, setErrors] = useState({})
  const [feedback, setFeedback] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [lookupError, setLookupError] = useState('')
  const [loadingBranches, setLoadingBranches] = useState(true)

  useEffect(() => {
    authFetch(`${API_URL}/branches`)
      .then(response => {
        if (!response.ok) throw new Error('Failed to load branches')
        return response.json()
      })
      .then(data => setBranches(data))
      .catch(() => setLookupError('Unable to load branches. Please try again.'))
      .finally(() => setLoadingBranches(false))
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
    setFeedback(null)
    setSubmitting(true)

    const newEquipment = {
      branch_id: branchId,
      name,
      quantity,
      condition
    }

    authFetch(`${API_URL}/equipment`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newEquipment)
    })
      .then(async response => {
        const data = await response.json().catch(() => ({}))
        if (!response.ok) throw new Error(data.error || 'Unable to create equipment record.')
        return data
      })
      .then(() => {
        setBranchId('')
        setName('')
        setQuantity('')
        setCondition('')
        onEquipmentCreated()
      })
      .then(() => setFeedback({ type: 'success', message: 'Equipment added successfully.' }))
      .catch(error => setFeedback({ type: 'error', message: error.message || 'Unable to create equipment record.' }))
      .finally(() => setSubmitting(false))
  }

  return (
    <section className="equipment-form-section"><div className="equipment-form-heading"><div className="equipment-form-icon"><Boxes size={19} /></div><div><h2>Add Equipment</h2><p>Register equipment and assign it to a branch.</p></div></div><form className="equipment-form" onSubmit={handleSubmit}><FeedbackMessage message={lookupError} /><div className="equipment-form-grid"><label className="equipment-field"><span>Branch</span><div className="equipment-input-wrap"><MapPin size={16} /><select value={branchId} onChange={e => setBranchId(e.target.value)} required>
        <option value="">-- Select a branch</option>
        {branches.map(branch => (
          <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>
        ))}
      </select></div>{errors.branchId && <small className="equipment-field-error">{errors.branchId}</small>}</label><label className="equipment-field"><span>Equipment name</span><div className="equipment-input-wrap"><Boxes size={16} /><input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="e.g. Treadmill" /></div>{errors.name && <small className="equipment-field-error">{errors.name}</small>}</label><label className="equipment-field"><span>Quantity</span><div className="equipment-input-wrap"><Boxes size={16} /><input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required placeholder="1" /></div>{errors.quantity && <small className="equipment-field-error">{errors.quantity}</small>}</label><label className="equipment-field"><span>Condition</span><div className="equipment-input-wrap"><ShieldCheck size={16} /><input type="text" value={condition} onChange={e => setCondition(e.target.value)} required placeholder="e.g. Good" /></div></label></div><FeedbackMessage message={feedback?.message} type={feedback?.type} /><div className="equipment-form-actions"><button type="submit" className="equipment-primary-button" disabled={submitting || loadingBranches}><Save size={16} /> {submitting ? 'Creating...' : loadingBranches ? 'Loading branches...' : 'Add Equipment'}</button></div></form></section>
  )
}

export default EquipmentForm
