"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"

interface MonthData {
  label: string
  paid: number
  pending: number
}

interface TrendChartProps {
  data: MonthData[]
}

export function TrendChart({ data }: TrendChartProps) {
  if (data.length === 0) return null

  const maxValue = Math.max(...data.flatMap((d) => [d.paid, d.pending]), 1)

  const width = 100
  const height = 50
  const paddingX = 2
  const paddingTop = 4
  const paddingBottom = 2
  const chartW = width - paddingX * 2
  const chartH = height - paddingTop - paddingBottom

  function getX(i: number) {
    return paddingX + (i / Math.max(data.length - 1, 1)) * chartW
  }

  function getY(value: number) {
    return paddingTop + chartH - (value / maxValue) * chartH
  }

  function makePath(values: number[]) {
    return values
      .map((v, i) => `${i === 0 ? "M" : "L"} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)}`)
      .join(" ")
  }

  const paidPath = makePath(data.map((d) => d.paid))
  const pendingPath = makePath(data.map((d) => d.pending))

  // Area fill for paid
  const paidArea =
    paidPath +
    ` L ${getX(data.length - 1).toFixed(1)} ${(paddingTop + chartH).toFixed(1)}` +
    ` L ${getX(0).toFixed(1)} ${(paddingTop + chartH).toFixed(1)} Z`

  const lastMonth = data[data.length - 1]

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
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full"
          preserveAspectRatio="none"
          role="img"
          aria-label="Grafico de tendencia de contas pagas e pendentes"
        >
          {/* Grid lines */}
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1={paddingX}
              x2={width - paddingX}
              y1={paddingTop + chartH * (1 - ratio)}
              y2={paddingTop + chartH * (1 - ratio)}
              stroke="currentColor"
              strokeOpacity={0.07}
              strokeWidth={0.2}
            />
          ))}

          {/* Paid area fill */}
          <path d={paidArea} fill="rgb(16,185,129)" fillOpacity={0.1} />

          {/* Paid line */}
          <path
            d={paidPath}
            fill="none"
            stroke="rgb(16,185,129)"
            strokeWidth={0.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Pending line */}
          <path
            d={pendingPath}
            fill="none"
            stroke="rgb(59,130,246)"
            strokeWidth={0.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="1.5 1"
          />

          {/* Dots */}
          {data.map((d, i) => (
            <g key={i}>
              <circle cx={getX(i)} cy={getY(d.paid)} r={0.8} fill="rgb(16,185,129)" />
              <circle cx={getX(i)} cy={getY(d.pending)} r={0.8} fill="rgb(59,130,246)" />
            </g>
          ))}
        </svg>

        {/* Month labels */}
        <div className="flex justify-between px-0.5 text-[10px] text-muted-foreground sm:text-xs">
          {data.map((d) => (
            <span key={d.label}>{d.label}</span>
          ))}
        </div>

        {/* Current month summary */}
        {lastMonth && (
          <div className="mt-2 flex gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-muted-foreground">Pago este mes: </span>
              <span className="font-semibold text-emerald-600">{formatCurrency(lastMonth.paid)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Pendente: </span>
              <span className="font-semibold text-blue-600">{formatCurrency(lastMonth.pending)}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
