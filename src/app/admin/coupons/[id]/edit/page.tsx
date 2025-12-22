'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
    ArrowLeft,
    Save,
    RefreshCw,
    Percent,
    Calendar
} from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

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

export default function EditCouponPage() {
    const params = useParams()
    const router = useRouter()
    const [coupon, setCoupon] = useState<Coupon | null>(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)

    // Form state
    const [code, setCode] = useState('')
    const [discountType, setDiscountType] = useState('percentage')
    const [discountValue, setDiscountValue] = useState('')
    const [usageLimit, setUsageLimit] = useState('')
    const [isActive, setIsActive] = useState(true)
    const [expiresAt, setExpiresAt] = useState('')

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

            // Populate form
            setCode(data.code)
            setDiscountType(data.discount_type)
            setDiscountValue(String(data.discount_value))
            setUsageLimit(data.usage_limit ? String(data.usage_limit) : '')
            setIsActive(data.is_active)
            setExpiresAt(data.expires_at ? data.expires_at.split('T')[0] : '')
        } catch (error: any) {
            console.error('Error fetching coupon:', error)
            toast.error('Failed to load coupon')
        } finally {
            setLoading(false)
        }
    }

    const handleSave = async () => {
        if (!coupon) return

        if (!code.trim()) {
            toast.error('Please enter a coupon code')
            return
        }

        if (!discountValue || parseFloat(discountValue) <= 0) {
            toast.error('Please enter a valid discount value')
            return
        }

        if (discountType === 'percentage' && parseFloat(discountValue) > 100) {
            toast.error('Percentage discount cannot exceed 100%')
            return
        }

        try {
            setSaving(true)

            const { error } = await supabase
                .from('coupons')
                .update({
                    code: code.toUpperCase().trim(),
                    discount_type: discountType,
                    discount_value: parseFloat(discountValue),
                    usage_limit: usageLimit ? parseInt(usageLimit) : null,
                    is_active: isActive,
                    expires_at: expiresAt ? new Date(expiresAt).toISOString() : null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', coupon.id)

            if (error) throw error

            toast.success('Coupon updated successfully')
            router.push(`/admin/coupons/${coupon.id}`)
        } catch (error: any) {
            console.error('Error saving coupon:', error)
            if (error.code === '23505') {
                toast.error('A coupon with this code already exists')
            } else {
                toast.error('Failed to save coupon')
            }
        } finally {
            setSaving(false)
        }
    }

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
                    <Link href={`/admin/coupons/${coupon.id}`}>
                        <Button variant="outline" size="icon">
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
                            Edit Coupon
                        </h1>
                        <p className="text-gray-600 mt-1 font-mono">{coupon.code}</p>
                    </div>
                </div>
                <div className="flex items-center space-x-3">
                    <Button variant="outline" asChild>
                        <Link href={`/admin/coupons/${coupon.id}`}>Cancel</Link>
                    </Button>
                    <Button
                        className="bg-red-600 hover:bg-red-700"
                        onClick={handleSave}
                        disabled={saving}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Form */}
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Coupon Details</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div>
                            <Label htmlFor="code">Coupon Code</Label>
                            <Input
                                id="code"
                                value={code}
                                onChange={(e) => setCode(e.target.value.toUpperCase())}
                                placeholder="SUMMER20"
                                className="font-mono uppercase"
                            />
                            <p className="text-sm text-gray-500 mt-1">
                                Customers will enter this code at checkout
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="discount_type">Discount Type</Label>
                                <Select value={discountType} onValueChange={setDiscountType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                                        <SelectItem value="fixed">Fixed Amount (₹)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label htmlFor="discount_value">
                                    Discount Value {discountType === 'percentage' ? '(%)' : '(₹)'}
                                </Label>
                                <Input
                                    id="discount_value"
                                    type="number"
                                    min="0"
                                    max={discountType === 'percentage' ? '100' : undefined}
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    placeholder={discountType === 'percentage' ? '20' : '500'}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="usage_limit">Usage Limit (optional)</Label>
                                <Input
                                    id="usage_limit"
                                    type="number"
                                    min="0"
                                    value={usageLimit}
                                    onChange={(e) => setUsageLimit(e.target.value)}
                                    placeholder="Unlimited"
                                />
                                <p className="text-sm text-gray-500 mt-1">
                                    Leave empty for unlimited uses
                                </p>
                            </div>
                            <div>
                                <Label htmlFor="expires_at">Expiry Date (optional)</Label>
                                <div className="relative">
                                    <Input
                                        id="expires_at"
                                        type="date"
                                        value={expiresAt}
                                        onChange={(e) => setExpiresAt(e.target.value)}
                                        min={new Date().toISOString().split('T')[0]}
                                    />
                                </div>
                                <p className="text-sm text-gray-500 mt-1">
                                    Leave empty for no expiration
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>Status</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div>
                                <Label htmlFor="active">Active</Label>
                                <p className="text-sm text-gray-500">Enable this coupon for use</p>
                            </div>
                            <Switch
                                id="active"
                                checked={isActive}
                                onCheckedChange={setIsActive}
                            />
                        </div>

                        <div className="border-t pt-4">
                            <div className="text-sm text-gray-500 space-y-2">
                                <div className="flex justify-between">
                                    <span>Times Used:</span>
                                    <span className="font-medium text-gray-900">{coupon.usage_count}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Created:</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(coupon.created_at).toLocaleDateString('en-IN')}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Preview */}
                        <div className="border-t pt-4">
                            <Label>Preview</Label>
                            <div className="mt-2 p-4 bg-gray-50 rounded-lg border-2 border-dashed">
                                <div className="text-center">
                                    <p className="font-mono text-xl font-bold text-gray-900">{code || 'CODE'}</p>
                                    <p className="text-lg text-green-600 mt-1">
                                        {discountType === 'percentage'
                                            ? `${discountValue || '0'}% OFF`
                                            : `₹${discountValue || '0'} OFF`}
                                    </p>
                                    {expiresAt && (
                                        <p className="text-sm text-gray-500 mt-2 flex items-center justify-center">
                                            <Calendar className="h-4 w-4 mr-1" />
                                            Expires {new Date(expiresAt).toLocaleDateString('en-IN')}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}
