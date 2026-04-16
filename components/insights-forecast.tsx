"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

interface InsightsForecastProps {
  recurring: number
  estimated: number
  total: number
}

export function InsightsForecast({ recurring, estimated, total }: InsightsForecastProps) {
  if (total === 0) return null

  const recurringPct = total > 0 ? Math.round((recurring / total) * 100) : 0
  const estimatedPct = 100 - recurringPct

  return (
    <Card>
      <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          Previsao proximo mes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
        <p className="text-lg font-bold text-foreground sm:text-2xl">
          {formatCurrency(total)}
        </p>

        {/* Stacked bar */}
        <div className="mt-2 flex h-3 w-full overflow-hidden rounded-full bg-muted">
          {recurring > 0 && (
            <div
              className="h-full bg-blue-500 transition-all duration-500"
              style={{ width: `${recurringPct}%` }}
            />
          )}
          {estimated > 0 && (
            <div
              className="h-full bg-amber-400 transition-all duration-500"
              style={{ width: `${estimatedPct}%` }}
            />
          )}
        </div>

        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-[10px] sm:text-xs">
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
            Recorrentes: {formatCurrency(recurring)}
          </span>
          <span className="flex items-center gap-1.5 text-muted-foreground">
            <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
            Estimativa variaveis: {formatCurrency(estimated)}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}
