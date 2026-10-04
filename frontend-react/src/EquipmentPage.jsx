import { authFetch } from './authFetch'
import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { API_URL } from './config'
import EquipmentList from './EquipmentList'
import EquipmentForm from './EquipmentForm'
import { Boxes, Receipt } from 'lucide-react'

function EquipmentPage() {
  const { t } = useTranslation(['equipment', 'common'])
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  const loadEquipment = useCallback(() => {
    setLoading(true)
    setPageError('')
    authFetch(`${API_URL}/equipment`)
      .then(response => { if (!response.ok) throw new Error(`Equipment request failed: ${response.status}`); return response.json() })
      .then(data => setEquipment(Array.isArray(data) ? data : []))
      .catch(error => { console.error('Failed to load equipment:', error); setEquipment([]); setPageError(t('equipmentLoadFailed')) })
      .finally(() => setLoading(false))
  }, [t])

  useEffect(() => {
    const loadTimer = setTimeout(loadEquipment, 0)
    return () => clearTimeout(loadTimer)
  }, [loadEquipment])

  return (
    <div className="page-container equipment-page">
      <div className="page-header">
        <div>
          <p className="page-eyebrow">{t('eyebrow')}</p>
          <h1>{t('equipmentTitle')}</h1>
          <p className="page-description">{t('equipmentDescription')}</p>
        </div>
        <div className="equipment-total">
          <Boxes size={19} />
          <span>{equipment.length}</span>
          <small>{t('totalItems')}</small>
        </div>
      </div>
      <EquipmentForm onEquipmentCreated={loadEquipment} />
      {pageError && (
        <div className="equipment-feedback">
          <Receipt size={17} />
          <span>{pageError}</span>
        </div>
      )}
      {loading ? (
        <div className="equipment-state">
          <div className="loading-spinner"></div>
          <h3>{t('loadingEquipment')}</h3>
          <p>{t('gettingInventoryReady')}</p>
        </div>
      ) : (
        <EquipmentList
          equipment={equipment}
          onEquipmentUpdated={loadEquipment}
          onEquipmentDeleted={loadEquipment}
        />
      )}
    </div>
  )
}

export default EquipmentPage
