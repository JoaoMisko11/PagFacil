"use client"

import { usePathname } from "next/navigation"
import { useEffect, useRef } from "react"

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.opacity = "0"
    el.style.transform = "translateY(8px)"
    requestAnimationFrame(() => {
      el.style.transition = "opacity 200ms ease-out, transform 200ms ease-out"
      el.style.opacity = "1"
      el.style.transform = "translateY(0)"
    })
  }, [pathname])

  return <div ref={ref}>{children}</div>
}
