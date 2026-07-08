"use client";

export function DashboardSkeleton() {
  return (
    <div className="space-y-8 animate-pulse">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
            <div className="h-3 w-20 bg-gray-200 rounded" />
            <div className="h-7 w-12 bg-gray-200 rounded" />
            <div className="h-2.5 w-16 bg-gray-100 rounded" />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 rounded-xl border border-gray-100 bg-white p-6 space-y-4">
          <div className="h-5 w-32 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-lg border border-gray-50 bg-gray-50/50 p-4 space-y-2">
                <div className="h-3 w-24 bg-gray-200 rounded" />
                <div className="h-3 w-full bg-gray-100 rounded" />
                <div className="flex gap-3">
                  <div className="h-2.5 w-16 bg-gray-100 rounded" />
                  <div className="h-2.5 w-16 bg-gray-100 rounded" />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
            <div className="h-5 w-28 bg-gray-200 rounded" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="space-y-2 py-2 border-b border-gray-50 last:border-0">
                <div className="h-3 w-32 bg-gray-200 rounded" />
                <div className="h-2.5 w-20 bg-gray-100 rounded" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-gray-100 bg-white p-5 space-y-3">
            <div className="h-5 w-24 bg-gray-200 rounded" />
            <div className="flex flex-wrap gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-8 w-8 rounded-full bg-gray-200" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
