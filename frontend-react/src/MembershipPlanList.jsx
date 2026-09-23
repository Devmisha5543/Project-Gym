import { useState } from 'react'
import {
  CreditCard,
  DollarSign,
  Sparkles,
  Pencil,
  Trash2,
  Save,
  X
} from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'

function MembershipPlanList({
  membershipPlans,
  onPlanUpdated,
  onPlanDeleted
}) {
  const [editingId, setEditingId] = useState(null)

  const [editForm, setEditForm] = useState({
    plan_name: '',
    price: '',
    perks: ''
  })

  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  function startEditing(plan) {
    setEditingId(plan.plan_id)

    setEditForm({
      plan_name: plan.plan_name || '',
      price: plan.price ?? '',
      perks: plan.perks || ''
    })

    setError('')
  }

  function cancelEditing() {
    setEditingId(null)

    setEditForm({
      plan_name: '',
      price: '',
      perks: ''
    })

    setError('')
  }

  function handleEditChange(field, value) {
    setEditForm(prev => ({
      ...prev,
      [field]: value
    }))
  }

  async function handleUpdate(planId) {
    if (!editForm.plan_name.trim()) {
      setError('Plan name is required.')
      return
    }

    if (editForm.price === '' || Number(editForm.price) < 0) {
      setError('Please enter a valid price.')
      return
    }

    if (!editForm.perks.trim()) {
      setError('Perks are required.')
      return
    }

    setSaving(true)
    setError('')

    try {
      const response = await authFetch(
        `${API_URL}/membershipplans/${planId}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan_name: editForm.plan_name.trim(),
            price: editForm.price,
            perks: editForm.perks.trim()
          })
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to update membership plan.'
        )
      }

      setEditingId(null)

      if (onPlanUpdated) {
        onPlanUpdated()
      }
    } catch (err) {
      console.error('Failed to update membership plan:', err)
      setError(err.message || 'Unable to update membership plan.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(plan) {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${plan.plan_name}"?`
    )

    if (!confirmed) {
      return
    }

    setDeletingId(plan.plan_id)
    setError('')

    try {
      const response = await authFetch(
        `${API_URL}/membershipplans/${plan.plan_id}`,
        {
          method: 'DELETE'
        }
      )

      const data = await response.json()

      if (!response.ok) {
        throw new Error(
          data.error || 'Failed to delete membership plan.'
        )
      }

      if (onPlanDeleted) {
        onPlanDeleted()
      }
    } catch (err) {
      console.error('Failed to delete membership plan:', err)
      setError(
        err.message || 'Unable to delete membership plan.'
      )
    } finally {
      setDeletingId(null)
    }
  }

  if (membershipPlans.length === 0) {
    return (
      <div className="plan-state plan-empty-state">
        <div className="plan-state-icon">
          <CreditCard size={25} />
        </div>

        <h3>No membership plans yet</h3>
        <p>
          Create your first plan above to start building the catalogue.
        </p>
      </div>
    )
  }

  return (
    <div className="plan-list">

      {error && (
        <div className="plan-feedback plan-feedback-error">
          <span>{error}</span>
        </div>
      )}

      {membershipPlans.map(plan => (
        <article
          className="plan-card"
          key={plan.plan_id}
        >

          {editingId === plan.plan_id ? (

            /* EDIT MODE */
            <div className="plan-edit-mode">

              <div className="plan-card-topline">
                <div className="plan-card-icon">
                  <CreditCard size={20} />
                </div>

                <span className="plan-card-label">
                  Editing Plan #{plan.plan_id}
                </span>
              </div>

              <div className="plan-form-grid">

                <label className="plan-field">
                  <span>Plan name</span>

                  <div className="plan-input-wrap">
                    <CreditCard size={16} />

                    <input
                      type="text"
                      value={editForm.plan_name}
                      onChange={e =>
                        handleEditChange(
                          'plan_name',
                          e.target.value
                        )
                      }
                      disabled={saving}
                    />
                  </div>
                </label>

                <label className="plan-field">
                  <span>Price</span>

                  <div className="plan-input-wrap">
                    <DollarSign size={16} />

                    <input
                      type="number"
                      step="0.01"
                      value={editForm.price}
                      onChange={e =>
                        handleEditChange(
                          'price',
                          e.target.value
                        )
                      }
                      disabled={saving}
                    />
                  </div>
                </label>

                <label className="plan-field plan-field-wide">
                  <span>Perks</span>

                  <div className="plan-input-wrap">
                    <Sparkles size={16} />

                    <input
                      type="text"
                      value={editForm.perks}
                      onChange={e =>
                        handleEditChange(
                          'perks',
                          e.target.value
                        )
                      }
                      disabled={saving}
                    />
                  </div>
                </label>

              </div>

              <div className="plan-form-actions">

                <button
                  type="button"
                  className="plan-primary-button"
                  onClick={() =>
                    handleUpdate(plan.plan_id)
                  }
                  disabled={saving}
                >
                  <Save size={16} />

                  {saving
                    ? 'Saving...'
                    : 'Save Changes'}
                </button>

                <button
                  type="button"
                  className="plan-secondary-button"
                  onClick={cancelEditing}
                  disabled={saving}
                >
                  <X size={16} />
                  Cancel
                </button>

              </div>
            </div>

          ) : (

            /* NORMAL MODE */
            <>
              <div className="plan-card-topline">

                <div className="plan-card-icon">
                  <CreditCard size={20} />
                </div>

                <span className="plan-card-label">
                  Plan #{plan.plan_id}
                </span>

              </div>

              <h2>{plan.plan_name}</h2>

              <div className="plan-price">
                <DollarSign size={19} />

                <strong>
                  {Number(plan.price || 0).toFixed(2)}
                </strong>
              </div>

              <div className="plan-perks">
                <Sparkles size={15} />

                <span>
                  {plan.perks || 'Benefits not provided'}
                </span>
              </div>

              <div className="plan-card-actions">

                <button
                  type="button"
                  className="plan-secondary-button"
                  onClick={() => startEditing(plan)}
                >
                  <Pencil size={15} />
                  Edit
                </button>

                <button
                  type="button"
                  className="plan-danger-button"
                  onClick={() => handleDelete(plan)}
                  disabled={
                    deletingId === plan.plan_id
                  }
                >
                  <Trash2 size={15} />

                  {deletingId === plan.plan_id
                    ? 'Deleting...'
                    : 'Delete'}
                </button>

              </div>
            </>

          )}

        </article>
      ))}
    </div>
  )
}

export default MembershipPlanList