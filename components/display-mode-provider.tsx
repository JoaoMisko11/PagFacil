"use client"

import { createContext, useContext, useState, useEffect, useCallback } from "react"

type DisplayMode = "comfortable" | "compact"

const DisplayModeContext = createContext<{
  mode: DisplayMode
  toggle: () => void
}>({
  mode: "comfortable",
  toggle: () => {},
})

export function useDisplayMode() {
  return useContext(DisplayModeContext)
}

export function DisplayModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<DisplayMode>("comfortable")

  useEffect(() => {
    const saved = localStorage.getItem("displayMode") as DisplayMode | null
    if (saved === "compact" || saved === "comfortable") {
      setMode(saved)
    }
  }, [])

  const toggle = useCallback(() => {
    setMode((prev) => {
      const next = prev === "comfortable" ? "compact" : "comfortable"
      localStorage.setItem("displayMode", next)
      return next
    })
  }, [])

  return (
    <DisplayModeContext.Provider value={{ mode, toggle }}>
      {children}
    </DisplayModeContext.Provider>
  )
}
