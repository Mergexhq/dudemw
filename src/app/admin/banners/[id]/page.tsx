"use client"

import { useState, useEffect } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
    ArrowLeft,
    Image as ImageIcon,
    Loader2,
    Edit,
    Trash2,
    Eye,
    EyeOff,
    Calendar,
    ExternalLink,
    Target,
    MousePointer,
    MoreHorizontal,
    Layers,
    Type,
    LayoutGrid
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { toast } from "sonner"
import { Banner } from "@/lib/types/banners"

const getPlacementLabel = (placement: string): string => {
    switch (placement) {
        case "homepage-carousel":
            return "Homepage Carousel"
        case "product-listing-carousel":
            return "Product Listing Carousel"
        case "category-banner":
            return "Category Banner"
        case "top-marquee-banner":
            return "Top Marquee Banner"
        default:
            return placement
    }
}

const getStatusColor = (status: string): string => {
    switch (status) {
        case "active":
            return "bg-green-100 text-green-700 border-green-200"
        case "scheduled":
            return "bg-blue-100 text-blue-700 border-blue-200"
        case "expired":
            return "bg-gray-100 text-gray-700 border-gray-200"
        case "disabled":
            return "bg-red-100 text-red-700 border-red-200"
        default:
            return "bg-gray-100 text-gray-700 border-gray-200"
    }
}

const getActionTypeLabel = (actionType: string): string => {
    switch (actionType) {
        case "collection":
            return "Collection"
        case "category":
            return "Category"
        case "product":
            return "Product"
        case "external":
            return "External URL"
        default:
            return actionType || "None"
    }
}

const getBannerTypeInfo = (placement: string): { icon: React.ReactNode; color: string; label: string } => {
    switch (placement) {
        case "homepage-carousel":
            return {
                icon: <Layers className="w-4 h-4" />,
                color: "bg-purple-100 text-purple-700 border-purple-200",
                label: "Carousel"
            }
        case "product-listing-carousel":
            return {
                icon: <LayoutGrid className="w-4 h-4" />,
                color: "bg-blue-100 text-blue-700 border-blue-200",
                label: "PLP Carousel"
            }
        case "category-banner":
            return {
                icon: <ImageIcon className="w-4 h-4" />,
                color: "bg-green-100 text-green-700 border-green-200",
                label: "Category"
            }
        case "top-marquee-banner":
            return {
                icon: <Type className="w-4 h-4" />,
                color: "bg-amber-100 text-amber-700 border-amber-200",
                label: "Marquee"
            }
        default:
            return {
                icon: <ImageIcon className="w-4 h-4" />,
                color: "bg-gray-100 text-gray-700 border-gray-200",
                label: "Banner"
            }
    }
}

export default function BannerDetailPage() {
    const params = useParams()
    const router = useRouter()
    const bannerId = params.id as string

    const [loading, setLoading] = useState(true)
    const [banner, setBanner] = useState<Banner | null>(null)
    const [toggling, setToggling] = useState(false)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => {
        fetchBanner()
    }, [bannerId])

    const fetchBanner = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/admin/banners/${bannerId}`)
            if (!response.ok) throw new Error('Failed to fetch banner')

            const data = await response.json()
            setBanner(data)
        } catch (error) {
            console.error('Error fetching banner:', error)
            toast.error('Failed to load banner')
        } finally {
            setLoading(false)
        }
    }

    const handleToggleStatus = async () => {
        if (!banner) return

        try {
            setToggling(true)
            const response = await fetch(`/api/admin/banners/${bannerId}/toggle`, {
                method: 'POST',
            })

            if (!response.ok) throw new Error('Failed to toggle banner status')

            toast.success('Banner status updated')
            fetchBanner()
        } catch (error) {
            console.error('Error toggling banner status:', error)
            toast.error('Failed to update banner status')
        } finally {
            setToggling(false)
        }
    }

    const handleDelete = async () => {
        if (!banner) return
        if (!confirm('Are you sure you want to delete this banner? This action cannot be undone.')) return

        try {
            setDeleting(true)
            const response = await fetch(`/api/admin/banners/${bannerId}`, {
                method: 'DELETE',
            })

            if (!response.ok) throw new Error('Failed to delete banner')

            toast.success('Banner deleted successfully')
            router.push('/admin/banners')
        } catch (error) {
            console.error('Error deleting banner:', error)
            toast.error('Failed to delete banner')
        } finally {
            setDeleting(false)
        }
    }

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    if (!banner) {
        return (
            <div className="text-center py-16">
                <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Banner not found</h2>
                <p className="text-gray-600 mt-2">The banner you're looking for doesn't exist.</p>
                <Button asChild className="mt-4">
                    <Link href="/admin/banners">Back to Banners</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="w-full max-w-full overflow-x-hidden">
            <div className="space-y-6 lg:space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center space-x-4">
                        <div className="w-14 h-14 bg-gray-200 rounded-xl flex items-center justify-center overflow-hidden shadow-sm">
                            {(() => {
                                // Get first image from carousel if no main image
                                let thumbnailUrl = banner.image_url
                                if (!thumbnailUrl && banner.carousel_data) {
                                    try {
                                        const carouselItems = typeof banner.carousel_data === 'string'
                                            ? JSON.parse(banner.carousel_data)
                                            : banner.carousel_data
                                        if (Array.isArray(carouselItems) && carouselItems.length > 0) {
                                            thumbnailUrl = carouselItems[0].image_url || carouselItems[0].imageUrl
                                        }
                                    } catch (e) {
                                        console.error('Failed to parse carousel_data for thumbnail:', e)
                                    }
                                }

                                if (thumbnailUrl) {
                                    return (
                                        <img
                                            src={thumbnailUrl}
                                            alt={banner.internal_title}
                                            className="w-full h-full object-cover"
                                        />
                                    )
                                }
                                return <ImageIcon className="w-7 h-7 text-gray-400" />
                            })()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-gray-900">{banner.internal_title}</h1>
                                <Badge variant="outline" className={getBannerTypeInfo(banner.placement).color}>
                                    <span className="mr-1">{getBannerTypeInfo(banner.placement).icon}</span>
                                    {getBannerTypeInfo(banner.placement).label}
                                </Badge>
                            </div>
                            <div className="flex items-center space-x-2 mt-1">
                                <span className="text-sm text-gray-500">{getPlacementLabel(banner.placement)}</span>
                                <Badge variant="outline" className={getStatusColor(banner.status)}>
                                    {banner.status}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-2">
                        <Button
                            variant="outline"
                            className="border-gray-200"
                            onClick={handleToggleStatus}
                            disabled={toggling}
                        >
                            {toggling ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : banner.status === "active" ? (
                                <EyeOff className="h-4 w-4 mr-2" />
                            ) : (
                                <Eye className="h-4 w-4 mr-2" />
                            )}
                            {banner.status === "active" ? "Disable" : "Enable"}
                        </Button>
                        <Button className="bg-red-600 hover:bg-red-700 text-white" asChild>
                            <Link href={`/admin/banners/${banner.id}/edit`}>
                                <Edit className="w-4 h-4 mr-2" />
                                Edit Banner
                            </Link>
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="icon" className="border-gray-200">
                                    <MoreHorizontal className="w-4 h-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="bg-white/95 backdrop-blur-sm">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={handleDelete}
                                    disabled={deleting}
                                >
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Delete Banner
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Main Content - Banner Image */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Banner Preview */}
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-gray-900">
                                    <ImageIcon className="w-5 h-5 mr-2 text-red-600" />
                                    Banner Preview
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    // Parse carousel_data if it's a string
                                    let carouselItems: any[] = []
                                    if (banner.carousel_data) {
                                        try {
                                            carouselItems = typeof banner.carousel_data === 'string'
                                                ? JSON.parse(banner.carousel_data)
                                                : banner.carousel_data
                                        } catch (e) {
                                            console.error('Failed to parse carousel_data:', e)
                                        }
                                    }

                                    // Parse marquee_data if it's a string
                                    let marqueeItems: any[] = []
                                    if (banner.marquee_data) {
                                        try {
                                            marqueeItems = typeof banner.marquee_data === 'string'
                                                ? JSON.parse(banner.marquee_data)
                                                : banner.marquee_data
                                        } catch (e) {
                                            console.error('Failed to parse marquee_data:', e)
                                        }
                                    }

                                    if (banner.image_url) {
                                        return (
                                            <div className="relative rounded-lg overflow-hidden border border-gray-200">
                                                <img
                                                    src={banner.image_url}
                                                    alt={banner.internal_title}
                                                    className="w-full h-auto object-contain"
                                                />
                                            </div>
                                        )
                                    } else if (carouselItems.length > 0) {
                                        return (
                                            <div className="space-y-4">
                                                <p className="text-sm text-gray-600">This is a carousel banner with {carouselItems.length} images:</p>
                                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                                    {carouselItems.map((item: any, index: number) => (
                                                        <div key={index} className="relative rounded-lg overflow-hidden border border-gray-200">
                                                            <img
                                                                src={item.image_url || item.imageUrl}
                                                                alt={`Slide ${index + 1}`}
                                                                className="w-full h-32 object-cover"
                                                            />
                                                            <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 text-center">
                                                                Slide {index + 1}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    } else if (marqueeItems.length > 0) {
                                        return (
                                            <div className="space-y-4">
                                                <p className="text-sm text-gray-600">This is a marquee banner with scrolling text:</p>
                                                <div className="p-4 bg-gray-100 rounded-lg">
                                                    <p className="text-gray-700 font-medium">
                                                        {marqueeItems.map((item: any) => item.text).join(' • ')}
                                                    </p>
                                                </div>
                                            </div>
                                        )
                                    } else {
                                        return (
                                            <div className="text-center py-12 text-gray-500">
                                                <ImageIcon className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                                                <p>No image available for this banner</p>
                                            </div>
                                        )
                                    }
                                })()}
                            </CardContent>
                        </Card>

                        {/* Carousel Slides Info - Only show for carousel banners */}
                        {(() => {
                            let carouselItems: any[] = []
                            if (banner.carousel_data) {
                                try {
                                    carouselItems = typeof banner.carousel_data === 'string'
                                        ? JSON.parse(banner.carousel_data)
                                        : banner.carousel_data
                                } catch (e) {
                                    console.error('Failed to parse carousel_data:', e)
                                }
                            }

                            if (carouselItems.length > 0) {
                                return (
                                    <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-gray-900">
                                                <Target className="w-5 h-5 mr-2 text-red-600" />
                                                Carousel Slides ({carouselItems.length})
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {carouselItems.map((item: any, index: number) => (
                                                    <div key={index} className="p-4 rounded-lg bg-white/60 border border-gray-100">
                                                        <div className="flex items-start gap-4">
                                                            <div className="w-20 h-14 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                                                <img
                                                                    src={item.image_url || item.imageUrl}
                                                                    alt={`Slide ${index + 1}`}
                                                                    className="w-full h-full object-cover"
                                                                />
                                                            </div>
                                                            <div className="flex-1 min-w-0">
                                                                <h4 className="font-semibold text-gray-900 mb-1">Slide {index + 1}</h4>
                                                                {item.title_text && (
                                                                    <p className="text-sm text-gray-600 mb-1">"{item.title_text}"</p>
                                                                )}
                                                                <div className="flex flex-wrap gap-2 text-xs">
                                                                    <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                                                                        {getActionTypeLabel(item.action_type || '')}
                                                                    </Badge>
                                                                    {item.action_target && (
                                                                        <span className="text-gray-500 truncate max-w-[150px]">
                                                                            → {item.action_name || item.action_target}
                                                                        </span>
                                                                    )}
                                                                    {item.cta_text && (
                                                                        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                                                            {item.cta_text}
                                                                        </Badge>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            }
                            return null
                        })()}
                    </div>

                    {/* Sidebar - Banner Details */}
                    <div className="space-y-6">
                        {/* Banner Info */}
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                            <CardHeader>
                                <CardTitle className="text-gray-900">Banner Details</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-3">
                                    <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Placement</label>
                                        <p className="text-gray-900 font-medium mt-1">{getPlacementLabel(banner.placement)}</p>
                                    </div>

                                    <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Status</label>
                                        <div className="mt-1">
                                            <Badge variant="outline" className={getStatusColor(banner.status)}>
                                                {banner.status}
                                            </Badge>
                                        </div>
                                    </div>

                                    {banner.position && (
                                        <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Position</label>
                                            <p className="text-gray-900 font-medium mt-1">{banner.position}</p>
                                        </div>
                                    )}

                                    {banner.category && (
                                        <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Category</label>
                                            <p className="text-gray-900 font-medium mt-1">{banner.category}</p>
                                        </div>
                                    )}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Action Target */}
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-gray-900">
                                    <Target className="w-5 h-5 mr-2 text-red-600" />
                                    Action Target
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Action Type</label>
                                    <p className="text-gray-900 font-medium mt-1">{getActionTypeLabel(banner.action_type || '')}</p>
                                </div>

                                {banner.action_target && (
                                    <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Target</label>
                                        <p className="text-gray-900 font-medium mt-1 break-all">{banner.action_target}</p>
                                    </div>
                                )}

                                {banner.action_name && (
                                    <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Display Name</label>
                                        <p className="text-gray-900 font-medium mt-1">{banner.action_name}</p>
                                    </div>
                                )}

                                {banner.cta_text && (
                                    <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                        <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">CTA Text</label>
                                        <p className="text-gray-900 font-medium mt-1">{banner.cta_text}</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Schedule */}
                        <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center text-gray-900">
                                    <Calendar className="w-5 h-5 mr-2 text-red-600" />
                                    Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                                <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Start Date</label>
                                    <p className="text-gray-900 font-medium mt-1">
                                        {banner.start_date
                                            ? new Date(banner.start_date).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })
                                            : 'No start date'}
                                    </p>
                                </div>

                                <div className="p-3 rounded-lg bg-white/60 border border-gray-100">
                                    <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">End Date</label>
                                    <p className="text-gray-900 font-medium mt-1">
                                        {banner.end_date
                                            ? new Date(banner.end_date).toLocaleDateString('en-US', {
                                                year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit'
                                            })
                                            : 'No end date'}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    )
}
