export default function CategoryLoading() {
  return (
    <div className="bg-white pt-8 pb-4 md:pt-12 md:pb-6 text-center">
      <div className="mx-auto max-w-7xl px-4 md:px-6">
        {/* Title skeleton */}
        <div className="h-10 w-72 mx-auto animate-pulse bg-gray-200 rounded mb-3" />
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-56 mx-auto animate-pulse bg-gray-100 rounded" />
      </div>

      <section className="mx-auto max-w-7xl px-4 pb-12 md:px-6 pt-8">
        {/* Filter bar skeleton */}
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-40 animate-pulse bg-gray-200 rounded" />
          <div className="h-10 w-24 animate-pulse bg-gray-200 rounded-lg" />
        </div>

        {/* Product count skeleton */}
        <div className="h-4 w-48 animate-pulse bg-gray-100 rounded mb-4" />

        {/* Product grid skeleton */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 md:grid-cols-3 md:gap-y-10 lg:grid-cols-4 lg:gap-x-8">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-lg bg-gray-200" />
              <div className="mt-3 h-4 w-3/4 rounded bg-gray-200" />
              <div className="mt-2 h-4 w-1/2 rounded bg-gray-200" />
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
