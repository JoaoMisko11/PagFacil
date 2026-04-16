import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

function SectionSkeleton() {
  return (
    <Card>
      <CardHeader className="p-3 pb-1 sm:p-4 sm:pb-2">
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="p-3 pt-0 sm:p-4 sm:pt-0">
        <Skeleton className="h-24 w-full" />
      </CardContent>
    </Card>
  )
}

export default function InsightsLoading() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-9 w-20" />
      </div>
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <SectionSkeleton />
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      </div>
    </div>
  )
}
