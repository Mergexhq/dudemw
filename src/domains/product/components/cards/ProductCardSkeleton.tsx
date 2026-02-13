import { Skeleton } from "@/components/ui/skeleton"

export default function ProductCardSkeleton() {
    return (
        <div className="group relative">
            {/* Image Container - Aspect Ratio 3/4 */}
            <div className="relative aspect-[3/4] overflow-hidden bg-gray-100 rounded-sm">
                <Skeleton className="h-full w-full" />
            </div>

            {/* Content */}
            <div className="mt-3 space-y-2">
                {/* Title */}
                <Skeleton className="h-5 w-3/4" />

                {/* Description */}
                <Skeleton className="h-3 w-1/2" />

                {/* Rating */}
                <Skeleton className="h-3 w-1/3" />

                {/* Price and Add to Cart */}
                <div className="mt-2 flex items-center justify-between">
                    <div className="space-y-1">
                        <Skeleton className="h-5 w-20" />
                        <Skeleton className="h-3 w-24" />
                    </div>
                    <Skeleton className="h-9 w-9 rounded-full" />
                </div>
            </div>
        </div>
    )
}
