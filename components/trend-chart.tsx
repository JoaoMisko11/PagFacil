"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import { useState } from "react"

interface MonthData {
  label: string
  paid: number
  pending: number
}

interface TrendChartProps {
  data: MonthData[]
}

export function TrendChart({ data }: TrendChartProps) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null)

  if (data.length === 0) return null

  const maxValue = Math.max(...data.flatMap((d) => [d.paid, d.pending]), 1)

  // Round max to a nice number for Y axis
  function niceMax(v: number) {
    if (v <= 0) return 100
    const magnitude = Math.pow(10, Math.floor(Math.log10(v)))
    const normalized = v / magnitude
    if (normalized <= 1) return magnitude
    if (normalized <= 2) return 2 * magnitude
    if (normalized <= 5) return 5 * magnitude
    return 10 * magnitude
  }

  const yMax = niceMax(maxValue)
  const ySteps = [0, yMax * 0.25, yMax * 0.5, yMax * 0.75, yMax]

  const lastMonth = data[data.length - 1]
  const activeData = activeIndex !== null ? data[activeIndex] : null

  return (
    <Card>
      <CardHeader className="p-3 pb-0 sm:p-4 sm:pb-0">
        <CardTitle className="flex items-center justify-between text-xs font-medium text-muted-foreground sm:text-sm">
          <span>Evolucao (6 meses)</span>
          <div className="flex items-center gap-3 text-[10px] sm:text-xs">
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
              Pago
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-500" />
              Pendente
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2 sm:p-4 sm:pt-2">
        <div className="flex gap-1">
          {/* Y-axis labels */}
          <div className="flex flex-col justify-between py-1 text-[9px] text-muted-foreground sm:text-[10px]">
            {[...ySteps].reverse().map((v) => (
              <span key={v} className="text-right leading-none">
                {v >= 100 ? formatCurrency(v).replace("R$\u00a0", "") : "0"}
              </span>
            ))}
          </div>

          {/* Bars */}
          <div className="flex flex-1 items-end gap-1 sm:gap-2">
            {data.map((d, i) => {
              const paidH = (d.paid / yMax) * 100
              const pendingH = (d.pending / yMax) * 100
              const isActive = activeIndex === i

              return (
                <div
                  key={d.label}
                  className="group relative flex flex-1 flex-col items-center gap-0.5"
                  onMouseEnter={() => setActiveIndex(i)}
                  onMouseLeave={() => setActiveIndex(null)}
                  onTouchStart={() => setActiveIndex(i)}
                >
                  {/* Tooltip */}
                  {isActive && (
                    <div className="absolute -top-14 left-1/2 z-10 -translate-x-1/2 rounded-md border bg-popover px-2 py-1 text-[10px] shadow-md sm:text-xs">
                      <div className="font-medium">{d.label}</div>
                      <div className="text-emerald-600">Pago: {formatCurrency(d.paid)}</div>
                      <div className="text-blue-600">Pend: {formatCurrency(d.pending)}</div>
                    </div>
                  )}

                  {/* Bar group */}
                  <div className="flex h-28 w-full items-end justify-center gap-0.5 sm:h-36 sm:gap-1">
                    {/* Paid bar */}
                    <div
                      className="w-full max-w-4 rounded-t-sm bg-emerald-500 transition-all duration-200 sm:max-w-5"
                      style={{
                        height: `${Math.max(paidH, d.paid > 0 ? 2 : 0)}%`,
                        opacity: activeIndex === null || isActive ? 1 : 0.4,
                      }}
                    />
                    {/* Pending bar */}
                    <div
                      className="w-full max-w-4 rounded-t-sm bg-blue-500 transition-all duration-200 sm:max-w-5"
                      style={{
                        height: `${Math.max(pendingH, d.pending > 0 ? 2 : 0)}%`,
                        opacity: activeIndex === null || isActive ? 1 : 0.4,
                      }}
                    />
                  </div>

                  {/* Month label */}
                  <span className="text-[10px] text-muted-foreground sm:text-xs">{d.label}</span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Current month summary */}
        {lastMonth && (
          <div className="mt-3 flex gap-4 border-t pt-2 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground">Pago este mes: </span>
              <span className="font-semibold text-emerald-600">{formatCurrency(activeData?.paid ?? lastMonth.paid)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pendente: </span>
              <span className="font-semibold text-blue-600">{formatCurrency(activeData?.pending ?? lastMonth.pending)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
