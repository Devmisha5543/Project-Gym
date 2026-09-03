import { API_URL } from './config'
function ClassList({ classes }) {
  return (
    <ul>
      {classes.map(gymClass => (
        <li key={gymClass.class_id}>
          {gymClass.class_name} - {gymClass.schedule_time}
        </li>
      ))}
    </ul>
  )
}

export default ClassList
