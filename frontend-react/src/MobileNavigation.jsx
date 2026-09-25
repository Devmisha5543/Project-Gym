import { useState, useEffect, useSyncExternalStore } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  Users,
  Building2,
  Dumbbell,
  MoreHorizontal,
  X,
  CreditCard,
  UserCheck,
  Calendar,
  CalendarCheck,
  Receipt,
  Layers,
  GitBranch,
  Shield,
  Settings,
  LogOut,
  Moon,
  Sun,
} from 'lucide-react'
import { useGym, GymBrandMark } from './GymContext'
import { useTheme } from './ThemeContext'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'

const primaryNav = [
  { path: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/members', label: 'Members', icon: Users },
  { path: '/branches', label: 'Branches', icon: Building2 },
  { path: '/trainers', label: 'Trainers', icon: Dumbbell },
]

const moreRoutes = [
  { path: '/membershipplans', label: 'Membership Plans', icon: CreditCard },
  { path: '/memberships', label: 'Memberships', icon: UserCheck },
  {
    path: '/personaltrainingassignments',
    label: 'Personal Training',
    icon: Dumbbell,
  },
  { path: '/classes', label: 'Classes', icon: Calendar },
  { path: '/classbookings', label: 'Class Bookings', icon: CalendarCheck },
  { path: '/payments', label: 'Payments', icon: Receipt },
  { path: '/equipment', label: 'Equipment', icon: Layers },
  { path: '/trainerbranch', label: 'Trainer Branch', icon: GitBranch },
  { path: '/admins', label: 'Admin', icon: Shield },
  { path: '/settings', label: 'Settings', icon: Settings },
]

function subscribeToMedia(callback) {
  const mql = window.matchMedia('(max-width: 768px)')
  mql.addEventListener('change', callback)
  return () => mql.removeEventListener('change', callback)
}

function getMobileSnapshot() {
  return window.matchMedia('(max-width: 768px)').matches
}

function getMobileServerSnapshot() {
  return false
}

export default function MobileNavigation({ onLogout }) {
  const isMobile = useSyncExternalStore(
    subscribeToMedia,
    getMobileSnapshot,
    getMobileServerSnapshot
  )
  const [moreOpen, setMoreOpen] = useState(false)
  const [prevPathname, setPrevPathname] = useState('')
  const location = useLocation()
  const { gym, loading: gymLoading } = useGym()
  const { theme, toggleTheme } = useTheme()
  const reduceMotion = useReducedMotion()
  const menuTransition = { duration: reduceMotion ? 0 : 0.2, ease: 'easeOut' }

  // Close "More" menu when route changes during render
  if (prevPathname !== location.pathname) {
    setPrevPathname(location.pathname)
    if (moreOpen) {
      setMoreOpen(false)
    }
  }

  // Close "More" menu on Escape key press
  useEffect(() => {
    if (!moreOpen) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setMoreOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [moreOpen])

  if (!isMobile) {
    return null
  }

  const isMoreActive = moreRoutes.some(
    (route) => location.pathname === route.path
  )

  const gymName = gym?.name || 'Project Gym'

  return (
    <>
      {/* MOBILE HEADER */}
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <GymBrandMark logoUrl={gym?.logo_url} name={gymName} />
          <div className="brand-text">
            <h2>{gymLoading ? 'Loading...' : gymName}</h2>
            <span>Management</span>
          </div>
        </div>

        <div className="mobile-header-profile">
          <div className="admin-avatar">A</div>
          <span className="mobile-admin-badge">Admin</span>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="mobile-bottom-nav" aria-label="Mobile Navigation">
        {primaryNav.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `mobile-tab-item ${isActive ? 'active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} className="mobile-tab-icon" />
                  <span className="mobile-tab-label">{item.label}</span>
                  {isActive && <span className="mobile-tab-dot" />}
                </>
              )}
            </NavLink>
          )
        })}

        <button
          type="button"
          className={`mobile-tab-item mobile-tab-more ${
            moreOpen || isMoreActive ? 'active' : ''
          }`}
          onClick={() => setMoreOpen((prev) => !prev)}
          aria-label="More navigation options"
          aria-expanded={moreOpen}
        >
          <MoreHorizontal size={20} className="mobile-tab-icon" />
          <span className="mobile-tab-label">More</span>
          {(moreOpen || isMoreActive) && <span className="mobile-tab-dot" />}
        </button>
      </nav>

      {/* "MORE" MOBILE MENU SHEET */}
      <AnimatePresence>
        {moreOpen && (
          <motion.div
            className="mobile-more-layer"
            key="mobile-more-layer"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={menuTransition}
          >
            <motion.div
              className="mobile-more-overlay"
              onClick={() => setMoreOpen(false)}
              aria-hidden="true"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={menuTransition}
            />
            <motion.div
              className="mobile-more-sheet"
              role="dialog"
              aria-modal="true"
              aria-label="More navigation menu"
              initial={{ y: reduceMotion ? 0 : '100%' }}
              animate={{ y: 0 }}
              exit={{ y: reduceMotion ? 0 : '100%' }}
              transition={menuTransition}
            >
            <div className="mobile-sheet-drag-handle" />

            <div className="mobile-sheet-header">
              <h3>More Options</h3>
              <button
                type="button"
                className="mobile-sheet-close"
                onClick={() => setMoreOpen(false)}
                aria-label="Close menu"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-list">
              {moreRoutes.map((route) => {
                const Icon = route.icon
                return (
                  <NavLink
                    key={route.path}
                    to={route.path}
                    className={({ isActive }) =>
                      `mobile-sheet-item ${isActive ? 'active' : ''}`
                    }
                    onClick={() => setMoreOpen(false)}
                  >
                    <Icon size={18} className="mobile-sheet-icon" />
                    <span className="mobile-sheet-label">{route.label}</span>
                  </NavLink>
                )
              })}

              <button
                type="button"
                className="mobile-sheet-item mobile-sheet-theme"
                onClick={toggleTheme}
                aria-pressed={theme === 'light'}
              >
                {theme === 'dark'
                  ? <Sun size={18} className="mobile-sheet-icon" />
                  : <Moon size={18} className="mobile-sheet-icon" />}
                <span className="mobile-sheet-label">
                  {theme === 'dark' ? 'Light mode' : 'Dark mode'}
                </span>
              </button>

              <button
                type="button"
                className="mobile-sheet-item mobile-sheet-logout"
                onClick={() => {
                  setMoreOpen(false)
                  if (onLogout) {
                    onLogout()
                  }
                }}
              >
                <LogOut size={18} className="mobile-sheet-icon" />
                <span className="mobile-sheet-label">Logout</span>
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
