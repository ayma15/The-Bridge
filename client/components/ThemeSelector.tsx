import { useState } from 'react'
import { Palette } from 'lucide-react'
import { useTheme } from '../contexts/ThemeContext'

const colorSchemes = [
  { name: 'Blue', value: 'blue' as const, color: '#0ea5e9' },
  { name: 'Purple', value: 'purple' as const, color: '#8b5cf6' },
  { name: 'Green', value: 'green' as const, color: '#10b981' },
  { name: 'Orange', value: 'orange' as const, color: '#f59e0b' },
  { name: 'Red', value: 'red' as const, color: '#ef4444' },
]

export default function ThemeSelector() {
  const { colorScheme, setColorScheme } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        aria-label="Color scheme"
        title="Color scheme"
      >
        <Palette className="w-5 h-5 text-gray-600 dark:text-gray-400" />
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50 p-2">
            <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1 mb-1">
              Color Scheme
            </div>
            {colorSchemes.map((scheme) => (
              <button
                key={scheme.value}
                onClick={() => {
                  setColorScheme(scheme.value)
                  setIsOpen(false)
                }}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  colorScheme === scheme.value
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <div
                  className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-600"
                  style={{ backgroundColor: scheme.color }}
                />
                <span className="text-sm">{scheme.name}</span>
                {colorScheme === scheme.value && (
                  <span className="ml-auto text-primary-600 dark:text-primary-400">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

