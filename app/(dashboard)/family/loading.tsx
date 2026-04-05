import { Skeleton } from "@/components/ui/skeleton"

export default function FamilyLoading() {
  return (
    <div className="mx-auto max-w-xl px-4 py-6">
      <Skeleton className="mb-2 h-8 w-28" />
      <Skeleton className="mb-6 h-4 w-72" />
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}
