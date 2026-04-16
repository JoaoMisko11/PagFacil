"use client"

import { Card, CardContent } from "@/components/ui/card"
import type { InsightMessage } from "@/lib/insights-utils"

const ICONS: Record<InsightMessage["type"], string> = {
  saving: "\u2705",
  alert: "\u26A0\uFE0F",
  trend: "\uD83D\uDCC8",
  tip: "\uD83D\uDCA1",
}

const STYLES: Record<InsightMessage["type"], string> = {
  saving: "border-emerald-200/50 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-950/10",
  alert: "border-amber-200/50 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-950/10",
  trend: "border-blue-200/50 bg-blue-50/50 dark:border-blue-900/30 dark:bg-blue-950/10",
  tip: "border-purple-200/50 bg-purple-50/50 dark:border-purple-900/30 dark:bg-purple-950/10",
}

interface InsightsMessagesProps {
  messages: InsightMessage[]
}

export function InsightsMessages({ messages }: InsightsMessagesProps) {
  if (messages.length === 0) return null

  return (
    <div className="space-y-2">
      {messages.map((msg, i) => (
        <Card key={i} className={STYLES[msg.type]}>
          <CardContent className="flex items-start gap-2.5 p-3 sm:p-4">
            <span className="mt-0.5 text-base">{ICONS[msg.type]}</span>
            <div>
              <p className="text-xs font-semibold text-foreground sm:text-sm">{msg.title}</p>
              <p className="text-xs text-muted-foreground sm:text-sm">{msg.message}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
