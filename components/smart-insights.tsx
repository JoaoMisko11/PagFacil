"use client"

import { Card, CardContent } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

interface Insight {
  type: "pattern" | "tip"
  message: string
}

interface SmartInsightsProps {
  insights: Insight[]
}

export function SmartInsights({ insights }: SmartInsightsProps) {
  if (insights.length === 0) return null

  return (
    <Card className="border-blue-200/50 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/10">
      <CardContent className="p-3 sm:p-4">
        <p className="mb-2 text-xs font-semibold text-blue-700 dark:text-blue-400">
          &#128161; Insights
        </p>
        <div className="space-y-1.5">
          {insights.map((insight, i) => (
            <p key={i} className="text-xs text-muted-foreground sm:text-sm">
              {insight.message}
            </p>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
