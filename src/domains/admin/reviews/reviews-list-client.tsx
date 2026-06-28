'use client'

import { useState, useCallback, useTransition } from 'react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Star,
    Search,
    MoreHorizontal,
    CheckCircle2,
    XCircle,
    Trash2,
    MessageSquareReply,
    Eye,
    AlertTriangle,
    Clock,
    Filter,
    ChevronLeft,
    ChevronRight,
    Package,
} from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import Link from 'next/link'
import {
    updateReviewStatus,
    toggleReviewFeatured,
    updateAdminReply,
    deleteReview,
    bulkUpdateReviews,
    getAllReviews,
} from '@/lib/actions/reviews'
import { ProductReviewWithProduct, ReviewFilters, ReviewStats, ReviewStatus } from '@/types/database/reviews'

// ─── Star Rating Display ────────────────────────────────────────────────────

function StarRating({ rating, size = 'sm' }: { rating: number; size?: 'sm' | 'md' }) {
    const s = size === 'sm' ? 'w-3.5 h-3.5' : 'w-5 h-5'
    return (
        <div className="flex items-center gap-0.5">
            {[1, 2, 3, 4, 5].map((i) => (
                <Star
                    key={i}
                    className={`${s} ${i <= rating ? 'fill-amber-400 text-amber-400' : 'fill-gray-200 text-gray-200'}`}
                />
            ))}
        </div>
    )
}

// ─── Status Badge ───────────────────────────────────────────────────────────

const statusConfig: Record<ReviewStatus, { label: string; className: string; icon: React.ReactNode }> = {
    pending: {
        label: 'Pending',
        className: 'bg-amber-50 text-amber-700 border-amber-200',
        icon: <Clock className="w-3 h-3" />,
    },
    approved: {
        label: 'Approved',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
    rejected: {
        label: 'Rejected',
        className: 'bg-red-50 text-red-700 border-red-200',
        icon: <XCircle className="w-3 h-3" />,
    },
}

function StatusBadge({ status }: { status: ReviewStatus }) {
    const cfg = statusConfig[status] ?? statusConfig.pending
    return (
        <Badge variant="outline" className={`flex items-center gap-1 text-xs font-medium ${cfg.className}`}>
            {cfg.icon}
            {cfg.label}
        </Badge>
    )
}

// ─── Reply Dialog ───────────────────────────────────────────────────────────

function ReplyDialog({
    review,
    open,
    onClose,
    onSaved,
}: {
    review: ProductReviewWithProduct
    open: boolean
    onClose: () => void
    onSaved: (id: string, reply: string | null) => void
}) {
    const [reply, setReply] = useState(review.admin_reply ?? '')
    const [isPending, startTransition] = useTransition()

    const handleSave = () => {
        startTransition(async () => {
            try {
                await updateAdminReply(review.id, reply.trim() || null)
                onSaved(review.id, reply.trim() || null)
                toast.success('Reply saved')
                onClose()
            } catch {
                toast.error('Failed to save reply')
            }
        })
    }

    const handleClear = () => {
        startTransition(async () => {
            try {
                await updateAdminReply(review.id, null)
                onSaved(review.id, null)
                setReply('')
                toast.success('Reply cleared')
                onClose()
            } catch {
                toast.error('Failed to clear reply')
            }
        })
    }

    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <MessageSquareReply className="w-5 h-5 text-red-600" />
                        Reply to Review
                    </DialogTitle>
                    <DialogDescription className="sr-only">Write an admin reply visible on the storefront</DialogDescription>
                </DialogHeader>

                {/* Review summary */}
                <div className="bg-gray-50 rounded-lg p-4 space-y-2 border border-gray-100">
                    <div className="flex items-center justify-between">
                        <span className="font-medium text-sm text-gray-900">{review.reviewer_name}</span>
                        <StarRating rating={review.rating} />
                    </div>
                    {review.product_name && (
                        <p className="text-xs text-gray-500">
                            Product: <span className="font-medium text-gray-700">{review.product_name}</span>
                        </p>
                    )}
                    {review.comment && (
                        <p className="text-sm text-gray-600 line-clamp-3">{review.comment}</p>
                    )}
                </div>

                <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Admin Reply</label>
                    <Textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Write a public response to this customer review…"
                        className="min-h-[100px] resize-none"
                    />
                    <p className="text-xs text-gray-400">This reply will be shown publicly below the customer review.</p>
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    {review.admin_reply && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 mr-auto"
                            onClick={handleClear}
                            disabled={isPending}
                        >
                            Clear Reply
                        </Button>
                    )}
                    <Button variant="outline" onClick={onClose} disabled={isPending}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleSave}
                        disabled={isPending || !reply.trim()}
                    >
                        {isPending ? 'Saving…' : 'Save Reply'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Review Detail Dialog ───────────────────────────────────────────────────

function ReviewDetailDialog({
    review,
    open,
    onClose,
}: {
    review: ProductReviewWithProduct | null
    open: boolean
    onClose: () => void
}) {
    if (!review) return null
    return (
        <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Eye className="w-5 h-5 text-red-600" />
                        Review Details
                    </DialogTitle>
                    <DialogDescription className="sr-only">Full review content</DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="font-semibold text-gray-900">{review.reviewer_name}</p>
                            <p className="text-xs text-gray-500 mt-0.5">
                                {format(new Date(review.created_at), 'dd MMM yyyy, HH:mm')}
                            </p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                            <StarRating rating={review.rating} size="md" />
                            <StatusBadge status={review.status as ReviewStatus} />
                        </div>
                    </div>

                    {review.product_name && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                            <Package className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                                <p className="text-xs text-gray-500">Product</p>
                                {review.product_slug ? (
                                    <Link
                                        href={`/admin/products`}
                                        className="text-sm font-medium text-red-600 hover:text-red-700 truncate block"
                                    >
                                        {review.product_name}
                                    </Link>
                                ) : (
                                    <p className="text-sm font-medium text-gray-900 truncate">{review.product_name}</p>
                                )}
                            </div>
                        </div>
                    )}

                    {review.verified_purchase && (
                        <Badge className="bg-emerald-50 text-emerald-700 border-emerald-200" variant="outline">
                            <CheckCircle2 className="w-3 h-3 mr-1" /> Verified Purchase
                        </Badge>
                    )}

                    {review.comment && (
                        <div className="space-y-1">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Review</p>
                            <p className="text-sm text-gray-800 leading-relaxed">{review.comment}</p>
                        </div>
                    )}

                    {review.images && review.images.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                                Photos ({review.images.length})
                            </p>
                            <div className="flex flex-wrap gap-2">
                                {review.images.map((img, i) => (
                                    <a key={i} href={img} target="_blank" rel="noopener noreferrer">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img
                                            src={img}
                                            alt={`Review image ${i + 1}`}
                                            className="w-20 h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity"
                                        />
                                    </a>
                                ))}
                            </div>
                        </div>
                    )}

                    {review.admin_reply && (
                        <div className="space-y-1 bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <p className="text-xs font-medium text-blue-600 uppercase tracking-wide">Admin Reply</p>
                            <p className="text-sm text-blue-800 leading-relaxed">{review.admin_reply}</p>
                        </div>
                    )}

                    <div className="text-xs text-gray-400 space-y-0.5 pt-2 border-t border-gray-100">
                        <p>Review ID: <span className="font-mono">{review.id}</span></p>
                        {review.helpful_count != null && (
                            <p>{review.helpful_count} people found this helpful</p>
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

// ─── Main Table Row ─────────────────────────────────────────────────────────

function ReviewRow({
    review,
    selected,
    onSelect,
    onStatusChange,
    onFeaturedChange,
    onDelete,
    onReply,
    onView,
}: {
    review: ProductReviewWithProduct
    selected: boolean
    onSelect: (id: string, checked: boolean) => void
    onStatusChange: (id: string, status: ReviewStatus) => void
    onFeaturedChange: (id: string, featured: boolean) => void
    onDelete: (id: string) => void
    onReply: (review: ProductReviewWithProduct) => void
    onView: (review: ProductReviewWithProduct) => void
}) {
    const [isPending, startTransition] = useTransition()

    const handleStatus = (status: ReviewStatus) => {
        startTransition(async () => {
            try {
                await updateReviewStatus(review.id, status)
                onStatusChange(review.id, status)
                toast.success(`Review ${status}`)
            } catch {
                toast.error('Failed to update status')
            }
        })
    }

    const handleFeatured = () => {
        startTransition(async () => {
            try {
                const newVal = !review.is_featured
                await toggleReviewFeatured(review.id, newVal)
                onFeaturedChange(review.id, newVal)
                toast.success(newVal ? 'Review featured ⭐' : 'Feature removed')
            } catch {
                toast.error('Failed to update feature status')
            }
        })
    }

    const handleDelete = () => {
        startTransition(async () => {
            try {
                await deleteReview(review.id)
                onDelete(review.id)
                toast.success('Review deleted')
            } catch {
                toast.error('Failed to delete review')
            }
        })
    }

    return (
        <tr className={`border-b border-gray-100 hover:bg-gray-50/70 transition-colors ${isPending ? 'opacity-50' : ''}`}>
            {/* Checkbox */}
            <td className="px-4 py-3 w-10">
                <Checkbox
                    checked={selected}
                    onCheckedChange={(c) => onSelect(review.id, Boolean(c))}
                    aria-label={`Select review by ${review.reviewer_name}`}
                />
            </td>

            {/* Reviewer */}
            <td className="px-4 py-3 min-w-[140px]">
                <div className="space-y-0.5">
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[130px]">{review.reviewer_name}</p>
                    {review.verified_purchase && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-emerald-50 text-emerald-700 border-emerald-200">
                            ✓ Verified
                        </Badge>
                    )}
                </div>
            </td>

            {/* Product */}
            <td className="px-4 py-3 min-w-[140px]">
                {review.product_name ? (
                    <p className="text-sm text-gray-700 truncate max-w-[150px]" title={review.product_name}>
                        {review.product_name}
                    </p>
                ) : (
                    <span className="text-xs text-gray-400 italic">Unknown product</span>
                )}
            </td>

            {/* Rating */}
            <td className="px-4 py-3 w-[120px]">
                <StarRating rating={review.rating} />
            </td>

            {/* Review snippet */}
            <td className="px-4 py-3 max-w-[200px]">
                <p
                    className="text-sm text-gray-600 line-clamp-2 cursor-pointer hover:text-gray-900 transition-colors"
                    onClick={() => onView(review)}
                    title="Click to read full review"
                >
                    {review.comment || <span className="italic text-gray-400">No comment</span>}
                </p>
                {review.admin_reply && (
                    <p className="text-[11px] text-blue-500 mt-0.5 flex items-center gap-1">
                        <MessageSquareReply className="w-3 h-3" /> Admin replied
                    </p>
                )}
            </td>

            {/* Status */}
            <td className="px-4 py-3 w-[110px]">
                <StatusBadge status={review.status as ReviewStatus} />
            </td>

            {/* Featured */}
            <td className="px-4 py-3 w-[80px] text-center">
                <button
                    onClick={handleFeatured}
                    disabled={isPending}
                    title={review.is_featured ? 'Remove featured' : 'Mark as featured'}
                    className="transition-transform hover:scale-110 active:scale-95"
                >
                    <Star
                        className={`w-5 h-5 mx-auto ${review.is_featured
                            ? 'fill-amber-400 text-amber-400'
                            : 'fill-transparent text-gray-300 hover:text-amber-300'
                            }`}
                    />
                </button>
            </td>

            {/* Date */}
            <td className="px-4 py-3 w-[100px]">
                <p className="text-xs text-gray-500">
                    {format(new Date(review.created_at), 'dd MMM yyyy')}
                </p>
            </td>

            {/* Actions */}
            <td className="px-4 py-3 w-[60px]">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isPending}>
                            <MoreHorizontal className="w-4 h-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuItem onClick={() => onView(review)}>
                            <Eye className="w-4 h-4 mr-2 text-gray-500" /> View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onReply(review)}>
                            <MessageSquareReply className="w-4 h-4 mr-2 text-blue-500" /> Reply
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {review.status !== 'approved' && (
                            <DropdownMenuItem onClick={() => handleStatus('approved')} className="text-emerald-600">
                                <CheckCircle2 className="w-4 h-4 mr-2" /> Approve
                            </DropdownMenuItem>
                        )}
                        {review.status !== 'rejected' && (
                            <DropdownMenuItem onClick={() => handleStatus('rejected')} className="text-red-600">
                                <XCircle className="w-4 h-4 mr-2" /> Reject
                            </DropdownMenuItem>
                        )}
                        {review.status !== 'pending' && (
                            <DropdownMenuItem onClick={() => handleStatus('pending')}>
                                <Clock className="w-4 h-4 mr-2 text-amber-500" /> Set Pending
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-700 focus:bg-red-50"
                            onClick={() => {
                                if (confirm('Permanently delete this review? This cannot be undone.')) {
                                    handleDelete()
                                }
                            }}
                        >
                            <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </tr>
    )
}

// ─── Main Component ──────────────────────────────────────────────────────────

interface ReviewsListClientProps {
    initialReviews: ProductReviewWithProduct[]
    initialTotal: number
    initialStats: ReviewStats
}

export function ReviewsListClient({
    initialReviews,
    initialTotal,
    initialStats,
}: ReviewsListClientProps) {
    const [reviews, setReviews] = useState(initialReviews)
    const [total, setTotal] = useState(initialTotal)
    const [stats, setStats] = useState(initialStats)

    // Filters
    const [statusFilter, setStatusFilter] = useState<string>('all')
    const [ratingFilter, setRatingFilter] = useState<string>('all')
    const [search, setSearch] = useState('')
    const [page, setPage] = useState(1)
    const LIMIT = 20

    // Selection
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())

    // Dialogs
    const [replyTarget, setReplyTarget] = useState<ProductReviewWithProduct | null>(null)
    const [viewTarget, setViewTarget] = useState<ProductReviewWithProduct | null>(null)

    // Loading
    const [isLoading, setIsLoading] = useState(false)
    const [isBulkPending, startBulkTransition] = useTransition()

    // ── Fetch ────────────────────────────────────────────────────────────────

    const fetchReviews = useCallback(
        async (overrides: Partial<ReviewFilters> = {}) => {
            setIsLoading(true)
            try {
                const filters: ReviewFilters = {
                    status: (overrides.status ?? statusFilter) as ReviewFilters['status'],
                    rating: overrides.rating ?? (ratingFilter !== 'all' ? Number(ratingFilter) : 'all'),
                    search: overrides.search ?? search,
                    page: overrides.page ?? page,
                    limit: LIMIT,
                }
                const result = await getAllReviews(filters)
                setReviews(result.reviews)
                setTotal(result.total)
                setStats(result.stats)
                setSelectedIds(new Set())
            } catch {
                toast.error('Failed to reload reviews')
            } finally {
                setIsLoading(false)
            }
        },
        [statusFilter, ratingFilter, search, page]
    )

    // ── Filter handlers ──────────────────────────────────────────────────────

    const applyStatusFilter = (val: string) => {
        setStatusFilter(val)
        setPage(1)
        fetchReviews({ status: val as ReviewFilters['status'], page: 1 })
    }

    const applyRatingFilter = (val: string) => {
        setRatingFilter(val)
        setPage(1)
        fetchReviews({ rating: val !== 'all' ? Number(val) : 'all', page: 1 })
    }

    const applySearch = (val: string) => {
        setSearch(val)
        setPage(1)
        fetchReviews({ search: val, page: 1 })
    }

    const handlePageChange = (newPage: number) => {
        setPage(newPage)
        fetchReviews({ page: newPage })
    }

    // ── Selection ────────────────────────────────────────────────────────────

    const handleSelect = (id: string, checked: boolean) => {
        setSelectedIds((prev) => {
            const next = new Set(prev)
            checked ? next.add(id) : next.delete(id)
            return next
        })
    }

    const handleSelectAll = (checked: boolean) => {
        setSelectedIds(checked ? new Set(reviews.map((r) => r.id)) : new Set())
    }

    const allSelected = reviews.length > 0 && selectedIds.size === reviews.length
    const someSelected = selectedIds.size > 0 && !allSelected

    // ── Mutation callbacks from child rows ───────────────────────────────────

    const handleStatusChange = (id: string, status: ReviewStatus) => {
        setReviews((prev) =>
            prev.map((r) => (r.id === id ? { ...r, status } : r))
        )
    }

    const handleFeaturedChange = (id: string, is_featured: boolean) => {
        setReviews((prev) =>
            prev.map((r) => (r.id === id ? { ...r, is_featured } : r))
        )
    }

    const handleDelete = (id: string) => {
        setReviews((prev) => prev.filter((r) => r.id !== id))
        setTotal((prev) => prev - 1)
        setSelectedIds((prev) => {
            const next = new Set(prev)
            next.delete(id)
            return next
        })
    }

    const handleReplySaved = (id: string, reply: string | null) => {
        setReviews((prev) =>
            prev.map((r) => (r.id === id ? { ...r, admin_reply: reply } : r))
        )
    }

    // ── Bulk Actions ─────────────────────────────────────────────────────────

    const handleBulk = (action: 'approve' | 'reject' | 'delete' | 'feature' | 'unfeature') => {
        const ids = Array.from(selectedIds)
        if (!ids.length) return

        if (action === 'delete' && !confirm(`Permanently delete ${ids.length} review(s)? This cannot be undone.`)) return

        startBulkTransition(async () => {
            try {
                await bulkUpdateReviews(ids, action)
                toast.success(
                    action === 'delete'
                        ? `${ids.length} review(s) deleted`
                        : `${ids.length} review(s) ${action}d`
                )
                await fetchReviews()
            } catch {
                toast.error('Bulk action failed')
            }
        })
    }

    // ── Pagination ───────────────────────────────────────────────────────────

    const totalPages = Math.ceil(total / LIMIT)

    // ────────────────────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Customer Reviews</h1>
                    <p className="text-gray-500 mt-1">Manage and moderate product reviews from your customers</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
                {[
                    { label: 'Total', value: stats.total, color: 'text-gray-700', bg: 'bg-gray-50 border-gray-200' },
                    { label: 'Pending', value: stats.pending, color: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
                    { label: 'Approved', value: stats.approved, color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
                    { label: 'Rejected', value: stats.rejected, color: 'text-red-700', bg: 'bg-red-50 border-red-200' },
                    { label: 'Featured ⭐', value: stats.featured, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-200' },
                ].map((s) => (
                    <Card key={s.label} className={`border ${s.bg}`}>
                        <CardContent className="p-4">
                            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
                            <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Avg rating */}
            {stats.average_rating > 0 && (
                <div className="flex items-center gap-2 text-sm text-gray-600">
                    <StarRating rating={Math.round(stats.average_rating)} />
                    <span className="font-semibold text-gray-900">{stats.average_rating}</span>
                    <span>overall average rating</span>
                </div>
            )}

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search reviewer name…"
                        value={search}
                        onChange={(e) => applySearch(e.target.value)}
                        className="pl-9"
                    />
                </div>

                <Select value={statusFilter} onValueChange={applyStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <Filter className="w-4 h-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                </Select>

                <Select value={ratingFilter} onValueChange={applyRatingFilter}>
                    <SelectTrigger className="w-[140px]">
                        <Star className="w-4 h-4 mr-2 text-gray-400" />
                        <SelectValue placeholder="Rating" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Ratings</SelectItem>
                        {[5, 4, 3, 2, 1].map((r) => (
                            <SelectItem key={r} value={String(r)}>
                                {'★'.repeat(r)}{'☆'.repeat(5 - r)} &nbsp; {r} star{r !== 1 ? 's' : ''}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                {(statusFilter !== 'all' || ratingFilter !== 'all' || search) && (
                    <Button
                        variant="ghost"
                        size="sm"
                        className="text-gray-500"
                        onClick={() => {
                            setStatusFilter('all')
                            setRatingFilter('all')
                            setSearch('')
                            setPage(1)
                            fetchReviews({ status: 'all', rating: 'all', search: '', page: 1 })
                        }}
                    >
                        Clear filters
                    </Button>
                )}
            </div>

            {/* Bulk Action Bar */}
            {selectedIds.size > 0 && (
                <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    <span className="text-sm font-medium text-red-800">
                        {selectedIds.size} selected
                    </span>
                    <div className="flex items-center gap-2 ml-auto flex-wrap">
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                            onClick={() => handleBulk('approve')}
                            disabled={isBulkPending}
                        >
                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Approve All
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => handleBulk('reject')}
                            disabled={isBulkPending}
                        >
                            <XCircle className="w-3.5 h-3.5 mr-1" /> Reject All
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-amber-700 border-amber-300 hover:bg-amber-50"
                            onClick={() => handleBulk('feature')}
                            disabled={isBulkPending}
                        >
                            <Star className="w-3.5 h-3.5 mr-1 fill-amber-400 text-amber-400" /> Feature
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            className="text-red-700 border-red-300 hover:bg-red-50"
                            onClick={() => handleBulk('delete')}
                            disabled={isBulkPending}
                        >
                            <Trash2 className="w-3.5 h-3.5 mr-1" /> Delete All
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="text-gray-500"
                            onClick={() => setSelectedIds(new Set())}
                        >
                            Clear
                        </Button>
                    </div>
                </div>
            )}

            {/* Table */}
            <Card className="border-red-100/50 overflow-hidden">
                <div className="overflow-x-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-20">
                            <div className="animate-spin rounded-full h-8 w-8 border-2 border-red-100 border-t-red-600" />
                        </div>
                    ) : reviews.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
                            <Star className="w-14 h-14 mb-4 text-gray-200" />
                            <p className="text-lg font-semibold text-gray-600">No reviews found</p>
                            <p className="text-sm mt-1">
                                {statusFilter !== 'all' || ratingFilter !== 'all' || search
                                    ? 'Try adjusting your filters'
                                    : 'Customer reviews will appear here once submitted'}
                            </p>
                        </div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 w-10">
                                        <Checkbox
                                            checked={allSelected}
                                            ref={(el) => {
                                                if (el) (el as any).indeterminate = someSelected
                                            }}
                                            onCheckedChange={(c) => handleSelectAll(Boolean(c))}
                                            aria-label="Select all reviews"
                                        />
                                    </th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Reviewer</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Product</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Rating</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Review</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Status</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide text-center">Featured</th>
                                    <th className="px-4 py-3 text-xs font-semibold text-gray-600 uppercase tracking-wide">Date</th>
                                    <th className="px-4 py-3 w-[60px]" />
                                </tr>
                            </thead>
                            <tbody>
                                {reviews.map((review) => (
                                    <ReviewRow
                                        key={review.id}
                                        review={review}
                                        selected={selectedIds.has(review.id)}
                                        onSelect={handleSelect}
                                        onStatusChange={handleStatusChange}
                                        onFeaturedChange={handleFeaturedChange}
                                        onDelete={handleDelete}
                                        onReply={(r) => setReplyTarget(r)}
                                        onView={(r) => setViewTarget(r)}
                                    />
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-sm text-gray-500">
                            Showing {(page - 1) * LIMIT + 1}–{Math.min(page * LIMIT, total)} of {total} reviews
                        </p>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(page - 1)}
                                disabled={page === 1 || isLoading}
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="text-sm text-gray-600 font-medium">
                                {page} / {totalPages}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handlePageChange(page + 1)}
                                disabled={page >= totalPages || isLoading}
                            >
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                )}
            </Card>

            {/* Pending alert */}
            {stats.pending > 0 && statusFilter === 'all' && (
                <div className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm">
                    <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                    <span className="text-amber-800">
                        <strong>{stats.pending}</strong> review{stats.pending !== 1 ? 's' : ''} awaiting your approval.
                        <button
                            className="ml-2 underline font-medium hover:text-amber-900"
                            onClick={() => applyStatusFilter('pending')}
                        >
                            Review now →
                        </button>
                    </span>
                </div>
            )}

            {/* Dialogs */}
            {replyTarget && (
                <ReplyDialog
                    review={replyTarget}
                    open={!!replyTarget}
                    onClose={() => setReplyTarget(null)}
                    onSaved={handleReplySaved}
                />
            )}

            <ReviewDetailDialog
                review={viewTarget}
                open={!!viewTarget}
                onClose={() => setViewTarget(null)}
            />
        </div>
    )
}
