import { Skeleton } from "@/components/ui/skeleton"

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <Skeleton className="mb-6 h-8 w-40" />
      <div className="space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-4 w-36" />
          <div className="flex gap-3">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  )
}
