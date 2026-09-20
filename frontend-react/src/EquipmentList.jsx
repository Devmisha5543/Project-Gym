import { Boxes, MapPin, ShieldCheck } from 'lucide-react'
function EquipmentList({ equipment }) {
  if (equipment.length === 0) return <div className="equipment-state"><div className="equipment-state-icon"><Boxes size={25} /></div><h3>No equipment recorded</h3><p>Add your first inventory item above to get started.</p></div>
  return (
    <div className="equipment-list">
      {equipment.map(item => (
        <article className="equipment-card" key={item.equipment_id}><div className="equipment-card-icon"><Boxes size={20} /></div><div className="equipment-card-main"><div className="equipment-card-title-row"><div><span className="equipment-card-label">Equipment #{item.equipment_id}</span><h2>{item.name}</h2></div><span className="equipment-quantity">Qty {item.quantity}</span></div><div className="equipment-card-details"><span><MapPin size={15} />Branch #{item.branch_id}</span><span><ShieldCheck size={15} />{item.condition}</span></div></div></article>
      ))}
    </div>
  )
}

export default EquipmentList
