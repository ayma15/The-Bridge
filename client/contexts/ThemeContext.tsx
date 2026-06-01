import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'
type ColorScheme = 'blue' | 'purple' | 'green' | 'orange' | 'red'
type ThemePreset = string

interface ThemeContextType {
  theme: Theme
  colorScheme: ColorScheme
  themePreset: ThemePreset
  isDark: boolean
  setTheme: (theme: Theme) => void
  setColorScheme: (scheme: ColorScheme) => void
  setThemePreset: (preset: ThemePreset) => void
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [colorScheme, setColorSchemeState] = useState<ColorScheme>('blue')
  const [themePreset, setThemePresetState] = useState<ThemePreset>('the-bridge')
  const [isDark, setIsDark] = useState(false)

  useEffect(() => {
    // Load theme from localStorage
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme
      const savedColorScheme = localStorage.getItem('colorScheme') as ColorScheme
      const savedThemePreset = localStorage.getItem('themePreset') as ThemePreset
      
      if (savedTheme) {
        setThemeState(savedTheme)
      }
      if (savedColorScheme) {
        setColorSchemeState(savedColorScheme)
      }
      if (savedThemePreset) {
        setThemePresetState(savedThemePreset)
      } else {
        setThemePresetState('the-bridge')
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = window.document.documentElement
      
      // Determine if dark mode should be active
      let shouldBeDark = false
      if (theme === 'dark') {
        shouldBeDark = true
      } else if (theme === 'light') {
        shouldBeDark = false
      } else {
        // System theme
        shouldBeDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      }

      setIsDark(shouldBeDark)

      // Apply theme class
      if (shouldBeDark) {
        root.classList.add('dark')
      } else {
        root.classList.remove('dark')
      }

      // Apply color scheme
      root.setAttribute('data-color-scheme', colorScheme)

      // Apply theme preset
      root.setAttribute('data-theme-preset', themePreset)
    }
  }, [theme, colorScheme, themePreset])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Listen for system theme changes
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => {
        if (theme === 'system') {
          setIsDark(mediaQuery.matches)
          if (mediaQuery.matches) {
            document.documentElement.classList.add('dark')
          } else {
            document.documentElement.classList.remove('dark')
          }
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [theme])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', newTheme)
    }
  }

  const setColorScheme = (scheme: ColorScheme) => {
    setColorSchemeState(scheme)
    if (typeof window !== 'undefined') {
      localStorage.setItem('colorScheme', scheme)
    }
  }

  const setThemePreset = (preset: ThemePreset) => {
    setThemePresetState(preset)
    if (typeof window !== 'undefined') {
      localStorage.setItem('themePreset', preset)
    }
  }

  const toggleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('light')
    } else {
      // If system, toggle to opposite of current system preference
      if (typeof window !== 'undefined') {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(prefersDark ? 'light' : 'dark')
      }
    }
  }

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colorScheme,
        themePreset,
        isDark,
        setTheme,
        setColorScheme,
        setThemePreset,
        toggleTheme,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

