import { Skeleton } from "@/components/ui/skeleton"

export default function LoadingState() {
  return (
    <div className="max-w-5xl mx-auto w-full">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-6 w-40" />
        </div>
        <Skeleton className="h-8 w-24" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-8">
        <div className="md:col-span-3 space-y-10">
          <Skeleton className="h-64 w-full rounded-xl" />
          
          <div>
            <Skeleton className="h-7 w-40 mb-4" />
            <Skeleton className="h-48 w-full rounded-xl" />
          </div>

          <div>
            <Skeleton className="h-7 w-48 mb-4" />
            <Skeleton className="h-80 w-full rounded-xl" />
          </div>
        </div>
        
        <div className="md:col-span-2 space-y-6">
          <div>
            <Skeleton className="h-6 w-24 mb-4" />
            <div className="space-y-4 bg-white p-6 rounded-xl border border-slate-200">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="space-y-2 py-2">
                  <div className="flex justify-between">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-12" />
                  </div>
                  <Skeleton className="h-1.5 w-full rounded-full" />
                </div>
              ))}
            </div>
          </div>
          
          <Skeleton className="h-24 w-full rounded-xl" />
        </div>
      </div>
    </div>
  )
}
