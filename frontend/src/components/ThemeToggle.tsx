import { Sun, Moon } from "lucide-react"
import { useTheme } from "@/hooks/ThemeContext"

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === "dark"
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      className={`relative w-9 h-9 flex items-center justify-center rounded-full border border-surface-border text-text-primary/60 hover:text-text-primary hover:bg-surface-card transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 focus-visible:ring-offset-ring-offset-page ${className}`}
    >
      <Sun aria-hidden="true" className={`absolute w-4 h-4 transition-opacity duration-200 ${isDark ? "opacity-0" : "opacity-100"}`} />
      <Moon aria-hidden="true" className={`absolute w-4 h-4 transition-opacity duration-200 ${isDark ? "opacity-100" : "opacity-0"}`} />
    </button>
  )
}
