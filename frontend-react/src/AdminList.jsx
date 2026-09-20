import { ShieldCheck, UserRound } from 'lucide-react'
function AdminList({ admins }) {
  if (admins.length === 0) return <div className="admin-state"><div className="admin-state-icon"><ShieldCheck size={25} /></div><h3>No admin records visible</h3><p>New accounts are created above. The current API does not return an admin list.</p></div>
  return (
    <div className="admin-list">
      {admins.map(admin => (
        <article className="admin-card" key={admin.admin_id}><div className="admin-card-icon"><UserRound size={20} /></div><div><span className="admin-card-label">Administrator #{admin.admin_id}</span><h2>{admin.name}</h2><div className="admin-card-details"><span>{admin.email}</span><span>{admin.phone}</span></div></div></article>
      ))}
    </div>
  )
}

export default AdminList
