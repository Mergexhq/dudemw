'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    ArrowLeft,
    Edit,
    Trash2,
    Calendar,
    Trophy,
    Target,
    Percent,
    ToggleLeft,
    ToggleRight,
    Megaphone
} from 'lucide-react'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { deleteCampaign, toggleCampaignStatus } from '@/lib/actions/campaigns'
import { CampaignWithDetails } from '@/types/database/campaigns'

interface CampaignDetailClientProps {
    campaign: CampaignWithDetails
}

export function CampaignDetailClient({ campaign }: CampaignDetailClientProps) {
    const router = useRouter()
    const [isDeleting, setIsDeleting] = useState(false)
    const [isToggling, setIsToggling] = useState(false)
    const [currentStatus, setCurrentStatus] = useState(campaign.status)

    const handleDelete = async () => {
        if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
            return
        }

        setIsDeleting(true)
        try {
            await deleteCampaign(campaign.id)
            toast.success('Campaign deleted successfully')
            router.push('/admin/campaigns')
        } catch (error) {
            toast.error('Failed to delete campaign')
        } finally {
            setIsDeleting(false)
        }
    }

    const handleToggleStatus = async () => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
        setIsToggling(true)
        try {
            await toggleCampaignStatus(campaign.id, newStatus)
            setCurrentStatus(newStatus)
            toast.success(`Campaign ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
        } catch (error) {
            toast.error('Failed to update campaign status')
        } finally {
            setIsToggling(false)
        }
    }

    const getRuleDisplayText = (rule: any) => {
        switch (rule.rule_type) {
            case 'min_items':
                return `Minimum ${(rule.value as any)?.count || 0} items in cart`
            case 'min_cart_value':
                return `Cart value ≥ ₹${(rule.value as any)?.amount || 0}`
            case 'category':
                return `Items from category: ${(rule.value as any)?.category_id || 'Not set'}`
            case 'collection':
                return `Items from collection: ${(rule.value as any)?.collection_id || 'Not set'}`
            default:
                return JSON.stringify(rule.value)
        }
    }

    const getActionDisplayText = (action: any) => {
        if (action.discount_type === 'flat') {
            return `₹${action.discount_value} off`
        } else {
            let text = `${action.discount_value}% off`
            if (action.max_discount) {
                text += ` (max ₹${action.max_discount})`
            }
            return text
        }
    }

    return (
        <div className="w-full max-w-full overflow-x-hidden">
            <div className="space-y-6 lg:space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" asChild>
                            <Link href="/admin/campaigns">
                                <ArrowLeft className="h-5 w-5" />
                            </Link>
                        </Button>
                        <div className="min-w-0">
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 truncate">
                                    {campaign.name}
                                </h1>
                                <Badge
                                    variant="secondary"
                                    className={
                                        currentStatus === 'active'
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            : currentStatus === 'inactive'
                                                ? "bg-gray-100 text-gray-700"
                                                : "bg-amber-50 text-amber-700 border-amber-100"
                                    }
                                >
                                    {currentStatus === 'active' ? '● Active' : currentStatus === 'inactive' ? '○ Inactive' : '○ Draft'}
                                </Badge>
                            </div>
                            {campaign.description && (
                                <p className="text-sm text-gray-500 mt-1">{campaign.description}</p>
                            )}
                        </div>
                    </div>
                    <div className="flex items-center space-x-3 flex-shrink-0">
                        <Button
                            variant="outline"
                            onClick={handleToggleStatus}
                            disabled={isToggling}
                        >
                            {currentStatus === 'active' ? (
                                <>
                                    <ToggleRight className="w-4 h-4 mr-2" />
                                    {isToggling ? 'Deactivating...' : 'Deactivate'}
                                </>
                            ) : (
                                <>
                                    <ToggleLeft className="w-4 h-4 mr-2" />
                                    {isToggling ? 'Activating...' : 'Activate'}
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2 className="w-4 h-4 mr-2" />
                            {isDeleting ? 'Deleting...' : 'Delete'}
                        </Button>
                    </div>
                </div>

                {/* Campaign Details */}
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Basic Info Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Megaphone className="w-5 h-5 text-red-600" />
                                <CardTitle>Basic Information</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-gray-500">Priority</span>
                                <div className="flex items-center gap-1">
                                    <Trophy className="w-4 h-4 text-amber-500" />
                                    <span className="font-medium">{campaign.priority}</span>
                                </div>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-gray-500">Apply Type</span>
                                <Badge variant="outline">{campaign.apply_type === 'auto' ? 'Automatic' : 'Coupon'}</Badge>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b">
                                <span className="text-sm text-gray-500">Stackable</span>
                                <span className="font-medium">{campaign.stackable ? 'Yes' : 'No'}</span>
                            </div>
                            <div className="py-2">
                                <div className="flex items-center gap-2 text-sm text-gray-500 mb-1">
                                    <Calendar className="w-4 h-4" />
                                    Duration
                                </div>
                                <div className="font-medium">
                                    {format(new Date(campaign.start_at), 'MMM d, yyyy')}
                                    {campaign.end_at && ` - ${format(new Date(campaign.end_at), 'MMM d, yyyy')}`}
                                    {!campaign.end_at && ' - No end date'}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Discount Card */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <Percent className="w-5 h-5 text-red-600" />
                                <CardTitle>Discount Settings</CardTitle>
                            </div>
                        </CardHeader>
                        <CardContent>
                            {campaign.actions && campaign.actions.length > 0 ? (
                                <div className="space-y-3">
                                    {campaign.actions.map((action, index) => (
                                        <div key={index} className="p-4 bg-red-50 rounded-lg border border-red-100">
                                            <div className="text-2xl font-bold text-red-600">
                                                {getActionDisplayText(action)}
                                            </div>
                                            <div className="text-sm text-gray-500 mt-1">
                                                Applies to: {action.applies_to === 'cart' ? 'Entire Cart' : 'Individual Items'}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-gray-500 text-sm">No discount actions configured</p>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Conditions Card */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-2">
                            <Target className="w-5 h-5 text-red-600" />
                            <CardTitle>Conditions</CardTitle>
                        </div>
                        <CardDescription>All conditions must be met for the campaign to apply</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {campaign.rules && campaign.rules.length > 0 ? (
                            <div className="space-y-2">
                                {campaign.rules.map((rule, index) => (
                                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-medium text-red-600">{index + 1}</span>
                                        </div>
                                        <div>
                                            <div className="font-medium text-gray-900">{getRuleDisplayText(rule)}</div>
                                            <div className="text-xs text-gray-500">
                                                Type: {rule.rule_type.replace('_', ' ')} | Operator: {rule.operator}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm">No conditions configured</p>
                        )}
                    </CardContent>
                </Card>

                {/* Timestamps */}
                <div className="text-xs text-gray-400 flex items-center gap-4">
                    <span>Created: {format(new Date(campaign.created_at), 'MMM d, yyyy h:mm a')}</span>
                    <span>Updated: {format(new Date(campaign.updated_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
            </div>
        </div>
    )
}
