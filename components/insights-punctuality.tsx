"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { PunctualityStats } from "@/lib/insights-utils"

interface InsightsPunctualityProps {
  data: PunctualityStats
}

export function InsightsPunctuality({ data }: InsightsPunctualityProps) {
  if (data.total === 0) return null

  const color =
    data.percentage >= 80
      ? "text-emerald-600 dark:text-emerald-400"
      : data.percentage >= 60
        ? "text-amber-600 dark:text-amber-400"
        : "text-red-600 dark:text-red-400"

  const ringColor =
    data.percentage >= 80
      ? "stroke-emerald-500"
      : data.percentage >= 60
        ? "stroke-amber-500"
        : "stroke-red-500"

  // SVG circle progress
  const size = 80
  const strokeWidth = 6
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (data.percentage / 100) * circumference

  return (
    <Card>
      <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          Pontualidade
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
        <div className="flex items-center gap-4">
          {/* Ring */}
          <div className="relative shrink-0">
            <svg width={size} height={size} className="-rotate-90">
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                className="stroke-muted"
              />
              <circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                strokeWidth={strokeWidth}
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                className={`${ringColor} transition-all duration-700`}
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-sm font-bold ${color}`}>
              {data.percentage}%
            </span>
          </div>

          {/* Stats */}
          <div className="space-y-1 text-xs sm:text-sm">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{data.onTime}</span> em dia
            </p>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{data.late}</span> atrasada{data.late !== 1 ? "s" : ""}
            </p>
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{data.total}</span> total pagas
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
