import { useState, useEffect } from 'react'
import MemberList from './MemberList'
import MemberForm from './MemberForm'
import BranchList from './BranchList'
import BranchForm from './BranchForm'
import TrainerList from './TrainerList'
import TrainerForm from './TrainerForm'
import MembershipPlanList from './MembershipPlanList'
import MembershipPlanForm from './MembershipPlanForm'
import MembershipList from './MembershipList'
import MembershipForm from './MembershipForm'
import PersonalTrainingAssignmentList from './PersonalTrainingAssignmentList'
import PersonalTrainingAssignmentForm from './PersonalTrainingAssignmentForm'
import ClassList from './ClassList'
import ClassForm from './ClassForm'
import ClassBookingList from './ClassBookingList'
import ClassBookingForm from './ClassBookingForm'
import PaymentList from './PaymentList'
import PaymentForm from './PaymentForm'
import EquipmentList from './EquipmentList'
import EquipmentForm from './EquipmentForm'
import TrainerBranchList from './TrainerBranchList'
import TrainerBranchForm from './TrainerBranchForm'
import AdminList from './AdminList'
import AdminForm from './AdminForm'

function App() {
  const [members, setMembers] = useState([])
  const [branches, setBranches] = useState([])
  const [trainers, setTrainers] = useState([])
  const [membershipPlans, setMembershipPlans] = useState([])
  const [memberships, setMemberships] = useState([])
  const [personalTrainingAssignments, setPersonalTrainingAssignments] = useState([])
  const [classes, setClasses] = useState([])
  const [classBookings, setClassBookings] = useState([])
  const [payments, setPayments] = useState([])
  const [equipment, setEquipment] = useState([])
  const [trainerBranches, setTrainerBranches] = useState([])
  const [admins, setAdmins] = useState([])

  function loadMembers() {
    fetch("http://127.0.0.1:5000/members")
      .then(response => response.json())
      .then(data => setMembers(data))
  }

  function loadBranches() {
    fetch("http://127.0.0.1:5000/branches")
      .then(response => response.json())
      .then(data => setBranches(data))
  }

  function loadTrainers() {
    fetch("http://127.0.0.1:5000/trainers")
      .then(response => response.json())
      .then(data => setTrainers(data))
  }

  function loadMembershipPlans() {
    fetch("http://127.0.0.1:5000/membershipplans")
      .then(response => response.json())
      .then(data => setMembershipPlans(data))
  }

  function loadMemberships() {
    fetch("http://127.0.0.1:5000/memberships")
      .then(response => response.json())
      .then(data => setMemberships(data))
  }

  function loadPersonalTrainingAssignments() {
    fetch("http://127.0.0.1:5000/personaltrainingassignments")
      .then(response => response.json())
      .then(data => setPersonalTrainingAssignments(data))
  }

  function loadClasses() {
    fetch("http://127.0.0.1:5000/classes")
      .then(response => response.json())
      .then(data => setClasses(data))
  }

  function loadClassBookings() {
    fetch("http://127.0.0.1:5000/classbookings")
      .then(response => response.json())
      .then(data => setClassBookings(data))
  }

  function loadPayments() {
    fetch("http://127.0.0.1:5000/payments")
      .then(response => response.json())
      .then(data => setPayments(data))
  }

  function loadEquipment() {
    fetch("http://127.0.0.1:5000/equipment")
      .then(response => response.json())
      .then(data => setEquipment(data))
  }

  function loadTrainerBranches() {
    fetch("http://127.0.0.1:5000/trainerbranch")
      .then(response => response.json())
      .then(data => setTrainerBranches(data))
  }

  function loadAdmins() {
    fetch("http://127.0.0.1:5000/admins")
      .then(response => response.json())
      .then(data => setAdmins(data))
  }

  useEffect(() => {
    loadMembers()
    loadBranches()
    loadTrainers()
    loadMembershipPlans()
    loadMemberships()
    loadPersonalTrainingAssignments()
    loadClasses()
    loadClassBookings()
    loadPayments()
    loadEquipment()
    loadTrainerBranches()
    loadAdmins()
  }, [])

  return (
    <div>
      <h2>Branch</h2>
      <BranchForm onBranchCreated={loadBranches} />
      <BranchList branches={branches} />

      <h2>Member</h2>
      <MemberForm onMemberCreated={loadMembers} />
      <MemberList members={members} />

      <h2>Trainer</h2>
      <TrainerForm onTrainerCreated={loadTrainers} />
      <TrainerList trainers={trainers} />

      <h2>MembershipPlan</h2>
      <MembershipPlanForm onMembershipPlanCreated={loadMembershipPlans} />
      <MembershipPlanList membershipPlans={membershipPlans} />

      <h2>Membership</h2>
      <MembershipForm onMembershipCreated={loadMemberships} />
      <MembershipList memberships={memberships} />

      <h2>PersonalTrainingAssignment</h2>
      <PersonalTrainingAssignmentForm onPersonalTrainingAssignmentCreated={loadPersonalTrainingAssignments} />
      <PersonalTrainingAssignmentList personalTrainingAssignments={personalTrainingAssignments} />

      <h2>Class</h2>
      <ClassForm onClassCreated={loadClasses} />
      <ClassList classes={classes} />

      <h2>ClassBooking</h2>
      <ClassBookingForm onClassBookingCreated={loadClassBookings} />
      <ClassBookingList classBookings={classBookings} />

      <h2>Payment</h2>
      <PaymentForm onPaymentCreated={loadPayments} />
      <PaymentList payments={payments} />

      <h2>Equipment</h2>
      <EquipmentForm onEquipmentCreated={loadEquipment} />
      <EquipmentList equipment={equipment} />

      <h2>TrainerBranch</h2>
      <TrainerBranchForm onTrainerBranchCreated={loadTrainerBranches} />
      <TrainerBranchList trainerBranches={trainerBranches} onTrainerBranchDeleted={loadTrainerBranches} />

      <h2>Admin</h2>
      <AdminForm onAdminCreated={loadAdmins} />
      <AdminList admins={admins} />
    </div>
  )
}

export default App
