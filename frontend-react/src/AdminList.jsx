function AdminList({ admins }) {
  return (
    <ul>
      {admins.map(admin => (
        <li key={admin.admin_id}>
          {admin.name} - {admin.email} - {admin.phone}
        </li>
      ))}
    </ul>
  )
}

export default AdminList
