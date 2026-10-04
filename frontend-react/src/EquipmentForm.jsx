import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { equipmentSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { Boxes, MapPin, Save, ShieldCheck } from 'lucide-react'
import FeedbackMessage from './FeedbackMessage'

function EquipmentForm({ onEquipmentCreated }) {
  const { t } = useTranslation(['equipment', 'common'])
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
      .then(data => setBranches(Array.isArray(data) ? data : []))
      .catch(() => setLookupError(t('branchLoadFailed')))
      .finally(() => setLoadingBranches(false))
  }, [t])

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
        if (!response.ok) throw new Error(data.error || t('equipmentAddFailed'))
        return data
      })
      .then(() => {
        setBranchId('')
        setName('')
        setQuantity('')
        setCondition('')
        onEquipmentCreated()
      })
      .then(() => setFeedback({ type: 'success', message: t('equipmentAdded') }))
      .catch(error => setFeedback({ type: 'error', message: error.message || t('equipmentAddFailed') }))
      .finally(() => setSubmitting(false))
  }

  return (
    <section className="equipment-form-section">
      <div className="equipment-form-heading">
        <div className="equipment-form-icon">
          <Boxes size={19} />
        </div>
        <div>
          <h2>{t('addEquipment')}</h2>
          <p>{t('addEquipmentDescription')}</p>
        </div>
      </div>
      <form className="equipment-form" onSubmit={handleSubmit}>
        <FeedbackMessage message={lookupError} />
        <div className="equipment-form-grid">
          <label className="equipment-field">
            <span>{t('branch', { ns: 'common' })}</span>
            <div className="equipment-input-wrap">
              <MapPin size={16} />
              <select value={branchId} onChange={e => setBranchId(e.target.value)} required>
                <option value="">{t('selectBranch')}</option>
                {branches.map(branch => (
                  <option key={branch.branch_id} value={branch.branch_id}>{branch.name}</option>
                ))}
              </select>
            </div>
            {errors.branchId && <small className="equipment-field-error">{errors.branchId}</small>}
          </label>
          <label className="equipment-field">
            <span>{t('equipmentName')}</span>
            <div className="equipment-input-wrap">
              <Boxes size={16} />
              <input type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={t('equipmentNamePlaceholder')} />
            </div>
            {errors.name && <small className="equipment-field-error">{errors.name}</small>}
          </label>
          <label className="equipment-field">
            <span>{t('quantity')}</span>
            <div className="equipment-input-wrap">
              <Boxes size={16} />
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} required placeholder={t('quantityPlaceholder')} />
            </div>
            {errors.quantity && <small className="equipment-field-error">{errors.quantity}</small>}
          </label>
          <label className="equipment-field">
            <span>{t('condition')}</span>
            <div className="equipment-input-wrap">
              <ShieldCheck size={16} />
              <input type="text" value={condition} onChange={e => setCondition(e.target.value)} required placeholder={t('conditionPlaceholder')} />
            </div>
          </label>
        </div>
        <FeedbackMessage message={feedback?.message} type={feedback?.type} />
        <div className="equipment-form-actions">
          <button type="submit" className="equipment-primary-button" disabled={submitting || loadingBranches}>
            <Save size={16} /> {submitting ? t('creating', { ns: 'common' }) : loadingBranches ? t('loading', { ns: 'common' }) : t('addEquipment')}
          </button>
        </div>
      </form>
    </section>
  )
}

export default EquipmentForm
