"use client"

import { useState } from "react"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface ChecklistItem {
  label: string
  done: boolean
  href: string
}

interface OnboardingChecklistProps {
  items: ChecklistItem[]
}

export function OnboardingChecklist({ items }: OnboardingChecklistProps) {
  const [dismissed, setDismissed] = useState(false)
  const completedCount = items.filter((i) => i.done).length
  const allDone = completedCount === items.length

  if (dismissed || allDone) return null

  const progress = (completedCount / items.length) * 100

  return (
    <Card className="border-primary/30 bg-primary/5">
      <CardHeader className="p-3 pb-0 sm:p-4 sm:pb-0">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-semibold text-foreground">
            Primeiros passos ({completedCount}/{items.length})
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-xs text-muted-foreground"
            onClick={() => setDismissed(true)}
          >
            Fechar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-2 sm:p-4 sm:pt-2">
        {/* Progress bar */}
        <div className="mb-3 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        <div className="space-y-1.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-2.5">
              <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${
                  item.done
                    ? "bg-primary text-primary-foreground"
                    : "border border-muted-foreground/30 text-muted-foreground"
                }`}
              >
                {item.done ? "✓" : ""}
              </div>
              {item.done ? (
                <span className="text-sm text-muted-foreground line-through">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="text-sm font-medium text-foreground hover:underline">
                  {item.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
