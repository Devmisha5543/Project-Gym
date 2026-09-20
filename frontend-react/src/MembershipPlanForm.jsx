import { useState } from 'react'
import { membershipPlanSchema } from './schemas'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { Check, CreditCard, DollarSign, Plus, Sparkles } from 'lucide-react'

function MembershipPlanForm({ onMembershipPlanCreated }) {
  const [planName, setPlanName] = useState('')
  const [price, setPrice] = useState('')
  const [perks, setPerks] = useState('')
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()

    const result = membershipPlanSchema.safeParse({ planName, price })
    if (!result.success) {
      const fieldErrors = {}
      result.error.issues.forEach(issue => {
        fieldErrors[issue.path[0]] = issue.message
      })
      setErrors(fieldErrors)
      return
    }
    setErrors({})

    const newPlan = {
      plan_name: planName,
      price,
      perks
    }

    authFetch(`${API_URL}/membershipplans`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newPlan)
    })
      .then(response => response.json())
      .then(() => {
        setPlanName('')
        setPrice('')
        setPerks('')
        onMembershipPlanCreated()
      })
  }

  return (
    <section className="plan-form-section">
      <div className="plan-form-heading">
        <div className="plan-form-icon">
          <Plus size={19} />
        </div>
        <div>
          <h2>Add New Plan</h2>
          <p>Set up a plan your members can choose from.</p>
        </div>
      </div>

      <form className="plan-form" onSubmit={handleSubmit}>
        <div className="plan-form-grid">
          <label className="plan-field">
            <span>Plan name</span>
            <div className="plan-input-wrap">
              <CreditCard size={16} />
              <input type="text" value={planName} onChange={e => setPlanName(e.target.value)} required placeholder="e.g. Premium Access" />
            </div>
            {errors.planName && <small className="plan-field-error">{errors.planName}</small>}
          </label>

          <label className="plan-field">
            <span>Price</span>
            <div className="plan-input-wrap">
              <DollarSign size={16} />
              <input type="number" step="0.01" value={price} onChange={e => setPrice(e.target.value)} required placeholder="0.00" />
            </div>
            {errors.price && <small className="plan-field-error">{errors.price}</small>}
          </label>

          <label className="plan-field plan-field-wide">
            <span>Perks</span>
            <div className="plan-input-wrap">
              <Sparkles size={16} />
              <input type="text" value={perks} onChange={e => setPerks(e.target.value)} required placeholder="e.g. Full gym access, classes, sauna" />
            </div>
          </label>
        </div>

        <div className="plan-form-actions">
          <button type="submit" className="plan-primary-button">
            <Check size={16} /> Add Plan
          </button>
        </div>
      </form>
    </section>
  )
}

export default MembershipPlanForm
