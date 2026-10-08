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
import AnalyticsPage from './AnalyticsPage'
import PersonalTrainingAssignmentPage from './PersonalTrainingAssignmentPage'
import ClassPage from './ClassPage'
import ClassBookingPage from './ClassBookingPage'
import PaymentPage from './PaymentPage'
import EquipmentPage from './EquipmentPage'
import TrainerBranchPage from './TrainerBranchPage'
import AdminPage from './AdminPage'
import DashboardPage from './DashboardPage'
import LoginPage from './LoginPage'
import ForgotPassword from './ForgotPassword'
import ResetPassword from './ResetPassword'
import MobileNavigation from './MobileNavigation'
import SettingsPage from './ModernSettingsPage'
import { GymProvider, useGym, GymBrandMark } from './GymContext'
import { Moon, Sun } from 'lucide-react'
import { ThemeProvider, useTheme } from './ThemeContext'
import { FeatureVisibilityProvider, useFeatureVisibility } from './FeatureVisibilityContext'
import { useTranslation } from 'react-i18next'


const navigation = [
  {
    title: 'management',
    items: [
      { path: '/dashboard', label: 'dashboard' },
      { path: '/analytics', label: 'analytics' },
      { path: '/members', label: 'members' },
      { path: '/branches', label: 'branches' },
      { path: '/trainers', label: 'trainers' },
      { path: '/membershipplans', label: 'membershipPlans' },
      {
        path: '/personaltrainingassignments',
        label: 'ptAssignments',
        featureKey: 'ptAssignments',
      },
      { path: '/classes', label: 'classes', featureKey: 'classes' },
      { path: '/classbookings', label: 'classBookings', featureKey: 'classBookings' },
      { path: '/payments', label: 'payments', featureKey: 'payments' },
      { path: '/equipment', label: 'equipment', featureKey: 'equipment' },
      { path: '/trainerbranch', label: 'trainerBranch', featureKey: 'trainerBranch' },
      { path: '/admins', label: 'admins' },
      { path: '/settings', label: 'settings' },
    ],
  },
]


function ProtectedLayout() {
  const { t } = useTranslation('navigation')
  const navigate = useNavigate()
  const { gym, loading: gymLoading } = useGym()
  const { theme, toggleTheme } = useTheme()
  const { visibility } = useFeatureVisibility()

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
           <h2>{gymLoading ? t('common:loading') : gymName}</h2>
           <span>{t('gymManagement')}</span>
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
                {t(section.title)}
              </p>

              {section.items
                .filter(item => !item.featureKey || visibility[item.featureKey])
                .map(item => (

                <NavLink
                  key={item.path}
                  to={item.path}
                  className={({ isActive }) =>
                    `nav-link ${isActive ? 'active' : ''}`
                  }
                >

                  <span className="nav-link-dot"></span>

                  <span>
                    {t(item.label)}
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
            aria-label={t(theme === 'dark' ? 'switchLight' : 'switchDark')}
            aria-pressed={theme === 'light'}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            <span>{t(theme === 'dark' ? 'lightMode' : 'darkMode')}</span>
          </button>

          <div className="admin-profile">

            <div className="admin-avatar">
              A
            </div>

            <div className="admin-info">
              <strong>Admin</strong>
              <span>{t('administrator')}</span>
            </div>

            <button
              className="logout-button"
              title={t('logout')}
              onClick={handleLogout}
            >
              {t('logout')}
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
    <FeatureVisibilityProvider>
    <Routes>

      {/* LOGIN */}
      <Route
        path="/login"
        element={<LoginRoute />}
      />

      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />


      {/* PROTECTED ROUTES */}
      <Route
        element={<ProtectedRoute />}
      >

        <Route
          path="/dashboard"
          element={<DashboardPage />}
        />

        <Route path="/analytics" element={<AnalyticsPage />} />

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
    </FeatureVisibilityProvider>
    </ThemeProvider>
  )
}


export default App
