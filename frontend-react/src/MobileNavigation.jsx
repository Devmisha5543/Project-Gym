import { useState, useEffect, useSyncExternalStore } from 'react'
import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  BarChart3,
  Users,
  Building2,
  Dumbbell,
  MoreHorizontal,
  X,
  CreditCard,
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
import { useFeatureVisibility } from './FeatureVisibilityContext'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import { useTranslation } from 'react-i18next'

const primaryNav = [
  { path: '/dashboard', label: 'dashboard', icon: LayoutDashboard },
  { path: '/analytics', label: 'analytics', icon: BarChart3 },
  { path: '/members', label: 'members', icon: Users },
  { path: '/branches', label: 'branches', icon: Building2 },
  { path: '/trainers', label: 'trainers', icon: Dumbbell },
]

const moreRoutes = [
  { path: '/membershipplans', label: 'membershipPlans', icon: CreditCard },
  {
    path: '/personaltrainingassignments',
    label: 'personalTraining',
    icon: Dumbbell,
    featureKey: 'ptAssignments',
  },
  { path: '/classes', label: 'classes', icon: Calendar, featureKey: 'classes' },
  { path: '/classbookings', label: 'classBookings', icon: CalendarCheck, featureKey: 'classBookings' },
  { path: '/payments', label: 'payments', icon: Receipt, featureKey: 'payments' },
  { path: '/equipment', label: 'equipment', icon: Layers, featureKey: 'equipment' },
  { path: '/trainerbranch', label: 'trainerBranch', icon: GitBranch, featureKey: 'trainerBranch' },
  { path: '/admins', label: 'admin', icon: Shield },
  { path: '/settings', label: 'settings', icon: Settings },
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
  const { t } = useTranslation('navigation')
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
  const { visibility } = useFeatureVisibility()
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

  const visibleMoreRoutes = moreRoutes.filter(
    route => !route.featureKey || visibility[route.featureKey]
  )

  const isMoreActive = visibleMoreRoutes.some(
    route => location.pathname === route.path
  )

  const gymName = gym?.name || 'Project Gym'

  return (
    <>
      {/* MOBILE HEADER */}
      <header className="mobile-header">
        <div className="mobile-header-brand">
          <GymBrandMark logoUrl={gym?.logo_url} name={gymName} />
          <div className="brand-text">
            <h2>{gymLoading ? t('common:loading') : gymName}</h2>
            <span>{t('managementLabel')}</span>
          </div>
        </div>

        <div className="mobile-header-profile">
          <div className="admin-avatar">A</div>
          <span className="mobile-admin-badge">{t('admin')}</span>
        </div>
      </header>

      {/* MOBILE BOTTOM NAVIGATION */}
      <nav className="mobile-bottom-nav" aria-label={t('mobileNavigation')}>
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
                  <span className="mobile-tab-label">{t(item.label)}</span>
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
          aria-label={t('moreNavigationOptions')}
          aria-expanded={moreOpen}
        >
          <MoreHorizontal size={20} className="mobile-tab-icon" />
          <span className="mobile-tab-label">{t('more')}</span>
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
              aria-label={t('moreNavigationMenu')}
              initial={{ y: reduceMotion ? 0 : '100%' }}
              animate={{ y: 0 }}
              exit={{ y: reduceMotion ? 0 : '100%' }}
              transition={menuTransition}
            >
            <div className="mobile-sheet-drag-handle" />

            <div className="mobile-sheet-header">
              <h3>{t('moreOptions')}</h3>
              <button
                type="button"
                className="mobile-sheet-close"
                onClick={() => setMoreOpen(false)}
                aria-label={t('common:close')}
              >
                <X size={18} />
              </button>
            </div>

            <div className="mobile-sheet-list">
              {visibleMoreRoutes.map((route) => {
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
                    <span className="mobile-sheet-label">{t(route.label)}</span>
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
                  {t(theme === 'dark' ? 'lightMode' : 'darkMode')}
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
                <span className="mobile-sheet-label">{t('logout')}</span>
              </button>
            </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
