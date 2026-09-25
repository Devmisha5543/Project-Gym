import { createContext, useContext, useEffect, useState } from 'react'

const ThemeContext = createContext(null)
const THEME_STORAGE_KEY = 'project-gym-theme'

function getInitialTheme() {
  const theme = localStorage.getItem(THEME_STORAGE_KEY) === 'light' ? 'light' : 'dark'
  document.documentElement.dataset.theme = theme
  return theme
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem(THEME_STORAGE_KEY, theme)
  }, [theme])

  function toggleTheme() {
    setTheme(current => current === 'dark' ? 'light' : 'dark')
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
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
