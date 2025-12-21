'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Edit,
    Trash2,
    Calendar,
    Eye,
    EyeOff,
    Percent,
    RefreshCw,
    Copy,
    Users,
    DollarSign
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import { formatCurrency } from '@/lib/utils'

interface Coupon {
    id: string
    code: string
    discount_type: string
    discount_value: number
    usage_limit: number | null
    usage_count: number
    is_active: boolean
    expires_at: string | null
    created_at: string
    updated_at: string
}

export default function CouponDetailPage() {
    const params = useParams()
    const router = useRouter()
    const [coupon, setCoupon] = useState<Coupon | null>(null)
    const [loading, setLoading] = useState(true)
    const [deleting, setDeleting] = useState(false)

    const supabase = createClient()

    useEffect(() => {
        fetchCoupon()
    }, [params.id])

    const fetchCoupon = async () => {
        try {
            setLoading(true)

            const { data, error } = await supabase
                .from('coupons')
                .select('*')
                .eq('id', params.id)
                .single()

            if (error) throw error
            setCoupon(data)
        } catch (error: any) {
            console.error('Error fetching coupon:', error)
            toast.error('Failed to load coupon')
        } finally {
            setLoading(false)
        }
    }

    const handleCopyCode = () => {
        if (!coupon) return
        navigator.clipboard.writeText(coupon.code)
        toast.success('Coupon code copied!')
    }

    const handleToggleActive = async () => {
        if (!coupon) return

        try {
            const { error } = await supabase
                .from('coupons')
                .update({ is_active: !coupon.is_active })
                .eq('id', coupon.id)

            if (error) throw error

            setCoupon({ ...coupon, is_active: !coupon.is_active })
            toast.success(coupon.is_active ? 'Coupon deactivated' : 'Coupon activated')
        } catch (error: any) {
            toast.error('Failed to update coupon status')
        }
    }

    const handleDelete = async () => {
        if (!coupon) return

        if (!confirm('Are you sure you want to delete this coupon? This action cannot be undone.')) {
            return
        }

        try {
            setDeleting(true)

            const { error } = await supabase
                .from('coupons')
                .delete()
                .eq('id', coupon.id)

            if (error) throw error

            toast.success('Coupon deleted successfully')
            router.push('/admin/coupons')
        } catch (error: any) {
            toast.error('Failed to delete coupon')
        } finally {
            setDeleting(false)
        }
    }

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'Never'
        return new Date(dateString).toLocaleDateString('en-IN', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const isExpired = coupon?.expires_at && new Date(coupon.expires_at) < new Date()
    const usagePercentage = coupon?.usage_limit
        ? Math.round((coupon.usage_count / coupon.usage_limit) * 100)
        : 0

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="h-8 w-8 animate-spin text-gray-400" />
            </div>
        )
    }

    if (!coupon) {
        return (
            <div className="text-center py-16">
                <Percent className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                <h2 className="text-xl font-semibold text-gray-900">Coupon not found</h2>
                <p className="text-gray-600 mt-2">The coupon you're looking for doesn't exist.</p>
                <Button asChild className="mt-4">
                    <Link href="/admin/coupons">Back to Coupons</Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div className="flex items-center space-x-4">
                    <Link href="/admin/coupons">
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <div className="flex items-center space-x-3">
                            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 font-mono">
                                {coupon.code}
                            </h1>
                            <Button variant="ghost" size="sm" onClick={handleCopyCode}>
                                <Copy className="h-4 w-4" />
                            </Button>
                            <Badge variant={coupon.is_active && !isExpired ? 'default' : 'secondary'}>
                                {isExpired ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                            </Badge>
                        </div>
                        <p className="text-gray-600 mt-1">
                            {coupon.discount_type === 'percentage'
                                ? `${coupon.discount_value}% off`
                                : `${formatCurrency(coupon.discount_value)} off`}
                        </p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" onClick={handleToggleActive}>
                        {coupon.is_active ? (
                            <>
                                <EyeOff className="h-4 w-4 mr-2" />
                                Deactivate
                            </>
                        ) : (
                            <>
                                <Eye className="h-4 w-4 mr-2" />
                                Activate
                            </>
                        )}
                    </Button>
                    <Button variant="outline" asChild>
                        <Link href={`/admin/coupons/${coupon.id}/edit`}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                        </Link>
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleting}
                    >
                        <Trash2 className="h-4 w-4 mr-2" />
                        {deleting ? 'Deleting...' : 'Delete'}
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Discount</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {coupon.discount_type === 'percentage'
                                        ? `${coupon.discount_value}%`
                                        : formatCurrency(coupon.discount_value)}
                                </p>
                            </div>
                            <div className="p-3 bg-green-100 rounded-full">
                                <DollarSign className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Times Used</p>
                                <p className="text-2xl font-bold text-gray-900">{coupon.usage_count}</p>
                            </div>
                            <div className="p-3 bg-blue-100 rounded-full">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Usage Limit</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {coupon.usage_limit || '∞'}
                                </p>
                            </div>
                            <div className="p-3 bg-purple-100 rounded-full">
                                <Percent className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm text-gray-500">Expires</p>
                                <p className="text-lg font-bold text-gray-900">
                                    {coupon.expires_at
                                        ? new Date(coupon.expires_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })
                                        : 'Never'}
                                </p>
                            </div>
                            <div className={`p-3 rounded-full ${isExpired ? 'bg-red-100' : 'bg-orange-100'}`}>
                                <Calendar className={`h-6 w-6 ${isExpired ? 'text-red-600' : 'text-orange-600'}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Details */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Coupon Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Code</label>
                                <p className="text-gray-900 mt-1 font-mono text-lg">{coupon.code}</p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Type</label>
                                <p className="text-gray-900 mt-1 capitalize">{coupon.discount_type}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium text-gray-500">Discount Value</label>
                                <p className="text-gray-900 mt-1">
                                    {coupon.discount_type === 'percentage'
                                        ? `${coupon.discount_value}%`
                                        : formatCurrency(coupon.discount_value)}
                                </p>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500">Status</label>
                                <p className="text-gray-900 mt-1">
                                    {isExpired ? 'Expired' : coupon.is_active ? 'Active' : 'Inactive'}
                                </p>
                            </div>
                        </div>

                        {coupon.usage_limit && (
                            <div>
                                <label className="text-sm font-medium text-gray-500">Usage Progress</label>
                                <div className="mt-2">
                                    <div className="flex justify-between text-sm mb-1">
                                        <span>{coupon.usage_count} used</span>
                                        <span>{coupon.usage_limit} limit</span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2">
                                        <div
                                            className={`h-2 rounded-full ${usagePercentage >= 100 ? 'bg-red-600' : usagePercentage >= 75 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                            style={{ width: `${Math.min(usagePercentage, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div>
                            <label className="text-sm font-medium text-gray-500">Created</label>
                            <p className="text-gray-900 mt-1 flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                {formatDate(coupon.created_at)}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Last Updated</label>
                            <p className="text-gray-900 mt-1 flex items-center">
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                {formatDate(coupon.updated_at)}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Expires At</label>
                            <p className={`mt-1 flex items-center ${isExpired ? 'text-red-600' : 'text-gray-900'}`}>
                                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                                {formatDate(coupon.expires_at)}
                            </p>
                        </div>
                        <div>
                            <label className="text-sm font-medium text-gray-500">Coupon ID</label>
                            <p className="text-gray-600 mt-1 text-xs font-mono break-all">
                                {coupon.id}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
