import { Moon, Sun } from 'lucide-react'
import { useTheme } from '../theme/ThemeContext'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
      className={`group relative inline-flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-medium transition-all
        ${isDark
          ? 'border-amber-400/30 bg-amber-400/10 text-amber-300 hover:bg-amber-400/20 hover:border-amber-400/50'
          : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-400'
        }
        ${className}`}
    >
      <span className="relative flex items-center justify-center w-4 h-4">
        {isDark ? (
          <Sun className="w-4 h-4" />
        ) : (
          <Moon className="w-4 h-4" />
        )}
      </span>
      <span className="hidden sm:inline">
        {isDark ? 'Light' : 'Dark'}
      </span>
    </button>
  )
}
