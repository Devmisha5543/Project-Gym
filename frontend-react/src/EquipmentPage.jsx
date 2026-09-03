import { useState, useEffect } from 'react'
import { API_URL } from './config'
import EquipmentList from './EquipmentList'
import EquipmentForm from './EquipmentForm'

function EquipmentPage() {
  const [equipment, setEquipment] = useState([])

  function loadEquipment() {
    fetch(`${API_URL}/equipment`)
      .then(response => response.json())
      .then(data => setEquipment(data))
  }

  useEffect(() => {
    loadEquipment()
  }, [])

  return (
    <div>
      <h1>Equipment</h1>
      <EquipmentForm onEquipmentCreated={loadEquipment} />
      <EquipmentList equipment={equipment} />
    </div>
  )
}

export default EquipmentPage
