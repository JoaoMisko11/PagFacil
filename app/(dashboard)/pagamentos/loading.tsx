import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardContent } from "@/components/ui/card"

export default function PagamentosLoading() {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div className="space-y-1">
          <Skeleton className="h-7 w-36" />
          <Skeleton className="h-4 w-48" />
        </div>
        <Skeleton className="h-9 w-28" />
      </div>

      {/* Tabs */}
      <Skeleton className="h-10 w-full rounded-lg" />

      {/* Bill cards */}
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-56" />
                </div>
                <Skeleton className="h-6 w-24" />
              </div>
              <div className="mt-3 flex gap-2 border-t pt-3">
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
                <Skeleton className="h-9 w-20" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
