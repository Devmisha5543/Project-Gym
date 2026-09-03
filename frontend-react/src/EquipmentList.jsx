import { API_URL } from './config'
function EquipmentList({ equipment }) {
  return (
    <ul>
      {equipment.map(item => (
        <li key={item.equipment_id}>
          {item.name} - {item.quantity} - {item.condition}
        </li>
      ))}
    </ul>
  )
}

export default EquipmentList
