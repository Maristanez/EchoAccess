import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react"

type Theme = "light" | "dark"
interface ThemeContextValue { theme: Theme; toggleTheme: () => void }

const STORAGE_KEY = "echoAccess-theme"
const ThemeContext = createContext<ThemeContextValue | null>(null)

function getInitialTheme(): Theme {
  try {
    const s = localStorage.getItem(STORAGE_KEY)
    if (s === "light" || s === "dark") return s
  } catch {}
  return window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark"
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(getInitialTheme)

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark")
    try { localStorage.setItem(STORAGE_KEY, theme) } catch {}
  }, [theme])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: light)")
    const handler = (e: MediaQueryListEvent) => {
      try { if (!localStorage.getItem(STORAGE_KEY)) setThemeState(e.matches ? "light" : "dark") }
      catch { setThemeState(e.matches ? "light" : "dark") }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const toggleTheme = useCallback(() => setThemeState(p => p === "dark" ? "light" : "dark"), [])
  return <ThemeContext.Provider value={{ theme, toggleTheme }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used inside <ThemeProvider>")
  return ctx
}
