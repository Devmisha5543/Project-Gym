import {
  Routes,
  Route,
  NavLink,
  Navigate,
  useNavigate,
  Outlet
} from 'react-router-dom'

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
import LoginPage from './LoginPage'
import MobileNavigation from './MobileNavigation'
import SettingsPage from './SettingsPage'
import { GymProvider, useGym, GymBrandMark } from './GymContext'
import { Moon, Sun } from 'lucide-react'
import { ThemeProvider, useTheme } from './ThemeContext'


const navigation = [
  {
    title: 'Main',
    items: [
      { path: '/dashboard', label: 'Dashboard' },
      { path: '/members', label: 'Members' },
      { path: '/branches', label: 'Branches' },
      { path: '/trainers', label: 'Trainers' },
    ],
  },
  {
    title: 'Management',
    items: [
      { path: '/membershipplans', label: 'Membership Plans' },
      { path: '/memberships', label: 'Memberships' },
      {
        path: '/personaltrainingassignments',
        label: 'PT Assignments',
      },
      { path: '/classes', label: 'Classes' },
      { path: '/classbookings', label: 'Class Bookings' },
      { path: '/payments', label: 'Payments' },
      { path: '/equipment', label: 'Equipment' },
    ],
  },
  {
    title: 'Relationships',
    items: [
      { path: '/trainerbranch', label: 'Trainer Branch' },
    ],
  },
  {
    title: 'System',
    items: [
      { path: '/admins', label: 'Admins' },
      { path: '/settings', label: 'Settings' },
    ],
  },
]


function ProtectedLayout() {

  const navigate = useNavigate()
  const { gym, loading: gymLoading } = useGym()
  const { theme, toggleTheme } = useTheme()

  function handleLogout() {
    localStorage.removeItem('token')
    navigate('/login')
  }

  const gymName = gym?.name || 'Project Gym'

  return (
    <div className="app-layout">

      {/* MOBILE NAVIGATION */}
      <MobileNavigation onLogout={handleLogout} />

      {/* SIDEBAR */}
      <aside className="sidebar">

        {/* BRAND */}
        <div className="sidebar-brand">

          <GymBrandMark logoUrl={gym?.logo_url} name={gymName} />

          <div className="brand-text">
           <h2>{gymLoading ? 'Loading...' : gymName}</h2>
           <span>Gym Management</span>
         </div>

        </div>


        {/* NAVIGATION */}
        <nav className="sidebar-nav">

          {navigation.map(section => (

            <div
              className="nav-section"
              key={section.title}
            >

              <p className="nav-section-title">
                {section.title}
              </p>

              {section.items.map(item => (

                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >

                  <span className="nav-link-dot"></span>

                  <span>
                    {item.label}
                  </span>

                </NavLink>

              ))}

            </div>

          ))}

        </nav>


        {/* SIDEBAR FOOTER */}
        <div className="sidebar-footer">

          <button
            type="button"
            className="theme-toggle"
            onClick={toggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            aria-pressed={theme === 'light'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>
          </button>

          <div className="admin-profile">

            <div className="admin-avatar">
              A
            </div>

            <div className="admin-info">
              <strong>Admin</strong>
              <span>Administrator</span>
            </div>

            <button
              className="logout-button"
              title="Log out"
              onClick={handleLogout}
            >
              Logout
            </button>

          </div>

        </div>

      </aside>


      {/* MAIN CONTENT */}
      <main className="main-content">
        <Outlet />
      </main>

    </div>
  )
}


function ProtectedRoute() {

  const token = localStorage.getItem('token')

  if (!token) {
    return <Navigate to="/login" replace />
  }

  return (
    <GymProvider>
      <ProtectedLayout />
    </GymProvider>
  )
}


function LoginRoute() {

  const token = localStorage.getItem('token')

  if (token) {
    return <Navigate to="/dashboard" replace />
  }

  return <LoginPage />
}


function App() {

  return (
    <ThemeProvider>
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={<LoginRoute />}
      />


      {/* PROTECTED ROUTES */}
      <Route
        element={<ProtectedRoute />}
      >

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route
          path="/members"
          element={<MembersPage />}
        />

        <Route
          path="/branches"
          element={<BranchPage />}
        />

        <Route
          path="/trainers"
          element={<TrainerPage />}
        />

        <Route
          path="/membershipplans"
          element={<MembershipPlanPage />}
        />

        <Route
          path="/memberships"
          element={<MembershipPage />}
        />

        <Route
          path="/personaltrainingassignments"
          element={<PersonalTrainingAssignmentPage />}
        />

        <Route
          path="/classes"
          element={<ClassPage />}
        />

        <Route
          path="/classbookings"
          element={<ClassBookingPage />}
        />

        <Route
          path="/payments"
          element={<PaymentPage />}
        />

        <Route
          path="/equipment"
          element={<EquipmentPage />}
        />

        <Route
          path="/trainerbranch"
          element={<TrainerBranchPage />}
        />

        <Route
          path="/admins"
          element={<AdminPage />}
        />

        <Route
          path="/settings"
          element={<SettingsPage />}
        />

      </Route>


      {/* DEFAULT */}
      <Route
        path="/"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />


      {/* UNKNOWN URL */}
      <Route
        path="*"
        element={
          <Navigate
            to="/dashboard"
            replace
          />
        }
      />

    </Routes>
    </ThemeProvider>
  )
}


export default App
