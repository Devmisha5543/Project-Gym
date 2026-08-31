import { useState, useEffect } from 'react'
import EquipmentList from './EquipmentList'
import EquipmentForm from './EquipmentForm'

function EquipmentPage() {
  const [equipment, setEquipment] = useState([])

  function loadEquipment() {
    fetch("http://127.0.0.1:5000/equipment")
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
