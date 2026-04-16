"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { formatCurrency } from "@/lib/format"
import type { SupplierRanking } from "@/lib/insights-utils"

interface InsightsTopSuppliersProps {
  data: SupplierRanking[]
}

export function InsightsTopSuppliers({ data }: InsightsTopSuppliersProps) {
  if (data.length === 0) return null

  return (
    <Card>
      <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">
          Top fornecedores
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
        <div className="space-y-2">
          {data.map((item, i) => (
            <div key={item.supplier} className="flex items-center gap-3">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-bold text-muted-foreground">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium capitalize text-foreground sm:text-sm">
                  {item.supplier}
                </p>
                <p className="text-[10px] text-muted-foreground sm:text-xs">
                  {item.count} conta{item.count !== 1 ? "s" : ""}
                </p>
              </div>
              <span className="shrink-0 text-xs font-semibold text-foreground sm:text-sm">
                {formatCurrency(item.total)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
