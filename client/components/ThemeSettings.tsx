import ThemeToggle from './ThemeToggle'
import ThemeSelector from './ThemeSelector'

export default function ThemeSettings() {
  return (
    <div className="flex items-center gap-2">
      <ThemeSelector />
      <ThemeToggle />
    </div>
  )
}

