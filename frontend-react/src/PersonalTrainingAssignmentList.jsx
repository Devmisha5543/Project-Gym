function PersonalTrainingAssignmentList({ personalTrainingAssignments }) {
  return (
    <ul>
      {personalTrainingAssignments.map(assignment => (
        <li key={assignment.assignment_id}>
          Assignment #{assignment.assignment_id} - Trainer {assignment.trainer_id} - Member {assignment.member_id} - {assignment.speciality} - {assignment.start_date} - {assignment.status}
        </li>
      ))}
    </ul>
  )
}

export default PersonalTrainingAssignmentList
