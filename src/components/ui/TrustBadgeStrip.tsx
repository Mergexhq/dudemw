"use client"

interface TrustBadgeStripProps {
    className?: string
}

export default function TrustBadgeStrip({ className = "" }: TrustBadgeStripProps) {
    return (
        <div className={`bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] backdrop-blur-sm bg-white/95 rounded-xl py-4 px-6 md:px-12 border border-gray-100 ${className}`}>
            <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 lg:gap-12">
                {/* Badge 1: Secure Checkout */}
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-[#4A5568]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">100% Secure</span>
                        <span className="text-[10px] text-gray-500 font-medium">Checkout Process</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="hidden h-8 w-px bg-gray-200 md:block" />

                {/* Badge 2: Easy Returns */}
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-[#4A5568]">
                        <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">Easy Returns</span>
                        <span className="text-[10px] text-gray-500 font-medium">Within 7 Days</span>
                    </div>
                </div>

                {/* Divider */}
                <div className="hidden h-8 w-px bg-gray-200 md:block" />

                {/* Badge 3: Costomer Rating */}
                <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-50 text-[#FFB800]">
                        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                        </svg>
                    </div>
                    <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 uppercase tracking-wide">4.9/5 Rated</span>
                        <span className="text-[10px] text-gray-500 font-medium">1000+ Reviews</span>
                    </div>
                </div>
            </div>
        </div>
    )
}
