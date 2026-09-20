import { useState, useEffect } from 'react'
import { API_URL } from './config'
import EquipmentList from './EquipmentList'
import EquipmentForm from './EquipmentForm'
import { Boxes, Receipt } from 'lucide-react'

function EquipmentPage() {
  const [equipment, setEquipment] = useState([])
  const [loading, setLoading] = useState(true)
  const [pageError, setPageError] = useState('')

  function loadEquipment() {
    setLoading(true)
    setPageError('')
    fetch(`${API_URL}/equipment`)
      .then(response => { if (!response.ok) throw new Error(`Equipment request failed: ${response.status}`); return response.json() })
      .then(data => setEquipment(data))
      .catch(error => { console.error('Failed to load equipment:', error); setEquipment([]); setPageError('Unable to load equipment. Please try again.') })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    const loadTimer = setTimeout(loadEquipment, 0)
    return () => clearTimeout(loadTimer)
  }, [])

  return (
    <div className="page-container equipment-page"><div className="page-header"><div><p className="page-eyebrow">GYM MANAGEMENT</p><h1>Equipment</h1><p className="page-description">Keep track of the equipment supporting every gym location.</p></div><div className="equipment-total"><Boxes size={19} /><span>{equipment.length}</span><small>Total Items</small></div></div>
      <EquipmentForm onEquipmentCreated={loadEquipment} />
      {pageError && <div className="equipment-feedback"><Receipt size={17} /><span>{pageError}</span></div>}
      {loading ? <div className="equipment-state"><div className="loading-spinner"></div><h3>Loading equipment</h3><p>Getting your inventory ready.</p></div> : <EquipmentList equipment={equipment} />}
    </div>
  )
}

export default EquipmentPage
