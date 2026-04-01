"use client"

import { useEffect, useState } from "react"

const COLORS = ["#00A868", "#34D399", "#F59E0B", "#3B82F6", "#EC4899", "#8B5CF6"]
const PARTICLE_COUNT = 30

export function ConfettiCelebration() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    function handler() {
      setShow(true)
    }
    window.addEventListener("pagafacil:all-paid", handler)
    return () => window.removeEventListener("pagafacil:all-paid", handler)
  }, [])

  useEffect(() => {
    if (show) {
      const timer = setTimeout(() => setShow(false), 3000)
      return () => clearTimeout(timer)
    }
  }, [show])

  if (!show) return null

  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden="true">
      {Array.from({ length: PARTICLE_COUNT }).map((_, i) => {
        const color = COLORS[i % COLORS.length]
        const left = Math.random() * 100
        const delay = Math.random() * 0.8
        const duration = 2 + Math.random() * 1.5
        const size = 6 + Math.random() * 6
        const rotation = Math.random() * 360
        const drift = (Math.random() - 0.5) * 120

        return (
          <span
            key={i}
            className="confetti-particle absolute"
            style={{
              left: `${left}%`,
              top: "-10px",
              width: `${size}px`,
              height: `${size * 0.6}px`,
              backgroundColor: color,
              borderRadius: Math.random() > 0.5 ? "50%" : "2px",
              transform: `rotate(${rotation}deg)`,
              animationDelay: `${delay}s`,
              animationDuration: `${duration}s`,
              // @ts-expect-error CSS custom property for drift
              "--drift": `${drift}px`,
            }}
          />
        )
      })}
    </div>
  )
}
