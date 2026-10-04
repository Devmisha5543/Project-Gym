import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Boxes, MapPin, ShieldCheck, Pencil, Trash2, Save, X } from 'lucide-react'
import { API_URL } from './config'
import { authFetch } from './authFetch'
import { equipmentSchema } from './schemas'

function EquipmentList({ equipment, onEquipmentUpdated, onEquipmentDeleted }) {
  const { t } = useTranslation(['equipment', 'common'])
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({ branch_id: '', name: '', quantity: '', condition: '' })
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  function startEditing(item) {
    setEditingId(item.equipment_id)
    setEditForm({
      branch_id: item.branch_id ?? '',
      name: item.name || '',
      quantity: item.quantity ?? '',
      condition: item.condition || ''
    })
    setError('')
  }

  function cancelEditing() {
    setEditingId(null)
    setEditForm({ branch_id: '', name: '', quantity: '', condition: '' })
    setError('')
  }

  function handleEditChange(field, value) {
    setEditForm(previous => ({ ...previous, [field]: value }))
  }

  async function handleUpdate(equipmentId) {
    const validation = equipmentSchema.safeParse({
      branchId: String(editForm.branch_id),
      name: editForm.name,
      quantity: editForm.quantity
    })
    if (!validation.success) {
      setError(validation.error.issues[0]?.message || t('checkDetails'))
      return
    }
    if (!editForm.condition.trim()) {
      setError(t('conditionRequired'))
      return
    }
    if (Number(editForm.quantity) < 0) {
      setError(t('quantityNonnegative'))
      return
    }

    setSaving(true)
    setError('')
    try {
      const response = await authFetch(`${API_URL}/equipment/${equipmentId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch_id: editForm.branch_id,
          name: editForm.name.trim(),
          quantity: editForm.quantity,
          condition: editForm.condition.trim()
        })
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || t('equipmentUpdateFailed'))
      setEditingId(null)
      onEquipmentUpdated?.()
    } catch (err) {
      console.error('Failed to update equipment:', err)
      setError(err.message || t('equipmentUpdateFailed'))
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(item) {
    if (!window.confirm(t('deleteEquipmentConfirm', { name: item.name }))) return
    setDeletingId(item.equipment_id)
    setError('')
    try {
      const response = await authFetch(`${API_URL}/equipment/${item.equipment_id}`, { method: 'DELETE' })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(data.error || t('equipmentDeleteFailed'))
      onEquipmentDeleted?.()
    } catch (err) {
      console.error('Failed to delete equipment:', err)
      setError(err.message || t('equipmentDeleteFailed'))
    } finally {
      setDeletingId(null)
    }
  }

  if (equipment.length === 0) return <div className="equipment-state"><div className="equipment-state-icon"><Boxes size={25} /></div><h3>{t('noEquipment')}</h3><p>{t('noEquipmentDescription')}</p></div>

  return (
    <div className="equipment-list">
      {error && <div className="equipment-feedback"><span>{error}</span></div>}
      {equipment.map(item => (
        <article className="equipment-card" key={item.equipment_id}>
          <div className="equipment-card-icon"><Boxes size={20} /></div>
          <div className="equipment-card-main">
            {editingId === item.equipment_id ? (
              <>
                <div className="equipment-card-title-row">
                  <div>
                    <span className="equipment-card-label">{t('editingEquipment', { id: item.equipment_id })}</span>
                    <h2>{t('editEquipment')}</h2>
                  </div>
                </div>
                <div className="equipment-form-grid equipment-edit-grid">
                  <label className="equipment-field"><span>{t('branchId')}</span><div className="equipment-input-wrap"><MapPin size={16} /><input type="number" value={editForm.branch_id} onChange={e => handleEditChange('branch_id', e.target.value)} disabled={saving} /></div></label>
                  <label className="equipment-field"><span>{t('equipmentName')}</span><div className="equipment-input-wrap"><Boxes size={16} /><input type="text" value={editForm.name} onChange={e => handleEditChange('name', e.target.value)} disabled={saving} /></div></label>
                  <label className="equipment-field"><span>{t('quantity')}</span><div className="equipment-input-wrap"><Boxes size={16} /><input type="number" min="0" value={editForm.quantity} onChange={e => handleEditChange('quantity', e.target.value)} disabled={saving} /></div></label>
                  <label className="equipment-field"><span>{t('condition')}</span><div className="equipment-input-wrap"><ShieldCheck size={16} /><input type="text" value={editForm.condition} onChange={e => handleEditChange('condition', e.target.value)} disabled={saving} /></div></label>
                </div>
                <div className="equipment-card-actions">
                  <button type="button" className="equipment-primary-button" onClick={() => handleUpdate(item.equipment_id)} disabled={saving}><Save size={15} />{saving ? t('saving', { ns: 'common' }) : t('saveChanges', { ns: 'common' })}</button>
                  <button type="button" className="equipment-secondary-button" onClick={cancelEditing} disabled={saving}><X size={15} />{t('cancel', { ns: 'common' })}</button>
                </div>
              </>
            ) : (
              <>
                <div className="equipment-card-title-row">
                  <div>
                    <span className="equipment-card-label">{t('equipmentCardLabel', { id: item.equipment_id })}</span>
                    <h2>{item.name}</h2>
                  </div>
                  <span className="equipment-quantity">{t('quantityCount', { count: item.quantity })}</span>
                </div>
                <div className="equipment-card-details">
                  <span><MapPin size={15} />{t('branchItem', { id: item.branch_id })}</span>
                  <span><ShieldCheck size={15} />{item.condition}</span>
                </div>
                <div className="equipment-card-actions">
                  <button type="button" className="equipment-secondary-button" onClick={() => startEditing(item)}><Pencil size={15} />{t('edit', { ns: 'common' })}</button>
                  <button type="button" className="equipment-danger-button" onClick={() => handleDelete(item)} disabled={deletingId === item.equipment_id}><Trash2 size={15} />{deletingId === item.equipment_id ? t('deleting', { ns: 'common' }) : t('delete', { ns: 'common' })}</button>
                </div>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  )
}

export default EquipmentList
