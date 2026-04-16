"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency, formatCategory } from "@/lib/format"
import type { CategoryBreakdown } from "@/lib/insights-utils"

const CATEGORY_COLORS: Record<string, string> = {
  FIXO: "bg-blue-500",
  VARIAVEL: "bg-amber-500",
  IMPOSTO: "bg-red-500",
  FORNECEDOR: "bg-emerald-500",
  ASSINATURA: "bg-purple-500",
  FUNCIONARIO: "bg-cyan-500",
  OUTRO: "bg-gray-400",
}

interface InsightsCategoryChartProps {
  data: CategoryBreakdown[]
}

export function InsightsCategoryChart({ data }: InsightsCategoryChartProps) {
  if (data.length === 0) return null

  const maxTotal = Math.max(...data.map((d) => d.total))

  return (
    <Card>
      <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          Gastos por categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
        <div className="space-y-2.5">
          {data.map((item) => (
            <div key={item.category}>
              <div className="mb-1 flex items-center justify-between text-xs sm:text-sm">
                <span className="font-medium text-foreground">
                  {formatCategory(item.category)}
                </span>
                <span className="text-muted-foreground">
                  {formatCurrency(item.total)} ({item.percentage}%)
                </span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${CATEGORY_COLORS[item.category] ?? "bg-gray-400"}`}
                  style={{ width: `${(item.total / maxTotal) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
