import { createContext, useContext, useEffect, useState } from 'react'
import { SIDEBAR_FEATURES } from './featureVisibility'

const FEATURE_VISIBILITY_STORAGE_KEY = 'project-gym-feature-visibility'

const DEFAULT_FEATURE_VISIBILITY = Object.fromEntries(
  SIDEBAR_FEATURES.map(feature => [feature.key, feature.defaultEnabled])
)

const FeatureVisibilityContext = createContext(null)

function getInitialVisibility() {
  try {
    const storedVisibility = JSON.parse(
      localStorage.getItem(FEATURE_VISIBILITY_STORAGE_KEY) || '{}'
    )

    return { ...DEFAULT_FEATURE_VISIBILITY, ...storedVisibility }
  } catch {
    return DEFAULT_FEATURE_VISIBILITY
  }
}

export function FeatureVisibilityProvider({ children }) {
  const [visibility, setVisibility] = useState(getInitialVisibility)

  useEffect(() => {
    localStorage.setItem(
      FEATURE_VISIBILITY_STORAGE_KEY,
      JSON.stringify(visibility)
    )
  }, [visibility])

  function setFeatureVisibility(featureKey, isVisible) {
    setVisibility(current => ({ ...current, [featureKey]: isVisible }))
  }

  return (
    <FeatureVisibilityContext.Provider
      value={{ visibility, setFeatureVisibility }}
    >
      {children}
    </FeatureVisibilityContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFeatureVisibility() {
  const context = useContext(FeatureVisibilityContext)
  if (!context) {
    throw new Error('useFeatureVisibility must be used within FeatureVisibilityProvider')
  }
  return context
}
