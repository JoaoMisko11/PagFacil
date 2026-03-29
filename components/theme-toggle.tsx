"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"

type Theme = "light" | "dark" | "system"

function getSystemTheme(): "light" | "dark" {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: Theme) {
  const resolved = theme === "system" ? getSystemTheme() : theme
  document.documentElement.classList.toggle("dark", resolved === "dark")
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system")

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    const initial = stored ?? "system"
    setTheme(initial)
    applyTheme(initial)

    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = () => {
      if ((localStorage.getItem("theme") ?? "system") === "system") {
        applyTheme("system")
      }
    }
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  function cycle() {
    const next: Theme = theme === "light" ? "dark" : theme === "dark" ? "system" : "light"
    setTheme(next)
    localStorage.setItem("theme", next)
    applyTheme(next)
  }

  const icon = theme === "light" ? "\u2600\uFE0F" : theme === "dark" ? "\uD83C\uDF19" : "\uD83D\uDCBB"

  return (
    <Button
      variant="ghost"
      size="sm"
      className="h-9 min-w-[44px] rounded-full text-xs sm:text-sm"
      onClick={cycle}
      aria-label={`Tema: ${theme === "light" ? "claro" : theme === "dark" ? "escuro" : "sistema"}`}
    >
      {icon}
    </Button>
  )
}
