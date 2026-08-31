import { Routes, Route, NavLink } from 'react-router-dom'
import './App.css'
import MembersPage from './MembersPage'
import BranchPage from './BranchPage'
import TrainerPage from './TrainerPage'
import MembershipPlanPage from './MembershipPlanPage'
import MembershipPage from './MembershipPage'
import PersonalTrainingAssignmentPage from './PersonalTrainingAssignmentPage'
import ClassPage from './ClassPage'
import ClassBookingPage from './ClassBookingPage'
import PaymentPage from './PaymentPage'
import EquipmentPage from './EquipmentPage'
import TrainerBranchPage from './TrainerBranchPage'
import AdminPage from './AdminPage'
import DashboardPage from './DashboardPage'

function App() {
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <h2>Gym Admin</h2>
        <nav>
          <NavLink to="/dashboard">Dashboard</NavLink>
          <NavLink to="/members">Members</NavLink>
          <NavLink to="/branches">Branches</NavLink>
          <NavLink to="/trainers">Trainers</NavLink>
          <NavLink to="/membershipplans">Membership Plans</NavLink>
          <NavLink to="/memberships">Memberships</NavLink>
          <NavLink to="/personaltrainingassignments">PT Assignments</NavLink>
          <NavLink to="/classes">Classes</NavLink>
          <NavLink to="/classbookings">Class Bookings</NavLink>
          <NavLink to="/payments">Payments</NavLink>
          <NavLink to="/equipment">Equipment</NavLink>
          <NavLink to="/trainerbranch">Trainer Branch</NavLink>
          <NavLink to="/admins">Admins</NavLink>
        </nav>
      </aside>

      <main className="main-content">
        <Routes>
          <Route path="/" element={<h1>Welcome — select a page</h1>} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/branches" element={<BranchPage />} />
          <Route path="/trainers" element={<TrainerPage />} />
          <Route path="/membershipplans" element={<MembershipPlanPage />} />
          <Route path="/memberships" element={<MembershipPage />} />
          <Route path="/personaltrainingassignments" element={<PersonalTrainingAssignmentPage />} />
          <Route path="/classes" element={<ClassPage />} />
          <Route path="/classbookings" element={<ClassBookingPage />} />
          <Route path="/payments" element={<PaymentPage />} />
          <Route path="/equipment" element={<EquipmentPage />} />
          <Route path="/trainerbranch" element={<TrainerBranchPage />} />
          <Route path="/admins" element={<AdminPage />} />
        </Routes>
      </main>
    </div>
  )
}

export default App