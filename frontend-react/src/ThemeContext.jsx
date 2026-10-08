import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const THEME_STORAGE_KEY = 'project-gym-theme'

function getStoredThemePreference() {
  const storedTheme = localStorage.getItem(THEME_STORAGE_KEY)
  return ['light', 'dark', 'system'].includes(storedTheme) ? storedTheme : 'dark'
}

function resolveTheme(preference) {
  if (preference !== 'system') return preference
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark'
}

export function ThemeProvider({ children }) {
  const [themePreference, setThemePreference] = useState(getStoredThemePreference)
  const [theme, setTheme] = useState(() => resolveTheme(themePreference))

  useEffect(() => {
    function applyTheme() {
      setTheme(resolveTheme(themePreference))
    }

    applyTheme()
    document.documentElement.dataset.theme = resolveTheme(themePreference)
    localStorage.setItem(THEME_STORAGE_KEY, themePreference)

    if (themePreference !== 'system') return undefined

    const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
    mediaQuery.addEventListener('change', applyTheme)
    return () => mediaQuery.removeEventListener('change', applyTheme)
  }, [themePreference])

  function toggleTheme() {
    setThemePreference(current => current === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{
      theme,
      themePreference,
      setThemePreference,
      toggleTheme
    }}>
      {children}
    </ThemeContext.Provider>
  )
}

// The provider and hook intentionally share this context module.
// eslint-disable-next-line react-refresh/only-export-components
export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) throw new Error('useTheme must be used within ThemeProvider')
  return context
}
