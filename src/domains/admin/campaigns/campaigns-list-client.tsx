'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Megaphone, Plus, Calendar, Trophy, Trash2, Eye } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { toast } from 'sonner'
import { deleteCampaign } from '@/lib/actions/campaigns'
import { CampaignWithDetails } from '@/types/database/campaigns'

interface CampaignCardProps {
    campaign: CampaignWithDetails
    onDelete: (id: string) => void
}

function CampaignCard({ campaign, onDelete }: CampaignCardProps) {
    const [isDeleting, setIsDeleting] = useState(false)

    const handleDelete = async (e: React.MouseEvent) => {
        e.preventDefault()
        e.stopPropagation()

        if (!confirm('Are you sure you want to delete this campaign?')) {
            return
        }

        setIsDeleting(true)
        try {
            await deleteCampaign(campaign.id)
            toast.success('Campaign deleted')
            onDelete(campaign.id)
        } catch (error) {
            toast.error('Failed to delete campaign')
        } finally {
            setIsDeleting(false)
        }
    }

    return (
        <Card className="hover:shadow-lg transition-all duration-300 border-red-100/50 h-full hover:border-red-200 relative group">
            <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors flex-shrink-0">
                            <Megaphone className="w-5 h-5 text-red-600" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <CardTitle className="text-lg font-medium text-gray-900 truncate">
                                {campaign.name}
                            </CardTitle>
                            {campaign.description && (
                                <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                                    {campaign.description}
                                </p>
                            )}
                        </div>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <Badge
                            variant="secondary"
                            className={
                                campaign.status === 'active'
                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                    : campaign.status === 'inactive'
                                        ? "bg-gray-100 text-gray-700"
                                        : "bg-amber-50 text-amber-700 border-amber-100"
                            }
                        >
                            {campaign.status === 'active' ? '● Active' : campaign.status === 'inactive' ? '○ Inactive' : '○ Draft'}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500">
                            <Trophy className="w-3.5 h-3.5" />
                            Priority {campaign.priority}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>
                            {format(new Date(campaign.start_at), 'MMM d, yyyy')}
                            {campaign.end_at && ` - ${format(new Date(campaign.end_at), 'MMM d, yyyy')}`}
                        </span>
                    </div>

                    <div className="flex items-center justify-between pt-2">
                        <div className="text-xs text-gray-500">
                            {campaign.rules?.length || 0} rule{campaign.rules?.length !== 1 ? 's' : ''} •
                            {campaign.actions?.length || 0} action{campaign.actions?.length !== 1 ? 's' : ''}
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                        <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            asChild
                        >
                            <Link href={`/admin/campaigns/${campaign.id}`}>
                                <Eye className="w-4 h-4 mr-1" />
                                View
                            </Link>
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            onClick={handleDelete}
                            disabled={isDeleting}
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

interface CampaignsListClientProps {
    initialCampaigns: CampaignWithDetails[]
}

export function CampaignsListClient({ initialCampaigns }: CampaignsListClientProps) {
    const router = useRouter()
    const [campaigns, setCampaigns] = useState(initialCampaigns)

    const handleDelete = (id: string) => {
        setCampaigns(campaigns.filter(c => c.id !== id))
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight text-gray-900">Campaigns</h1>
                    <p className="text-gray-500 mt-2">Create and manage auto-applying discount campaigns</p>
                </div>
                <Button asChild className="bg-red-600 hover:bg-red-700">
                    <Link href="/admin/campaigns/create">
                        <Plus className="w-4 h-4 mr-2" />
                        Create Campaign
                    </Link>
                </Button>
            </div>

            {campaigns.length === 0 ? (
                <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-16">
                        <Megaphone className="w-16 h-16 text-gray-300 mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                        <p className="text-gray-500 text-center mb-4 max-w-md">
                            Create your first auto-discount campaign to boost sales. Campaigns automatically apply when customers meet conditions.
                        </p>
                        <Button asChild className="bg-red-600 hover:bg-red-700">
                            <Link href="/admin/campaigns/create">
                                <Plus className="w-4 h-4 mr-2" />
                                Create First Campaign
                            </Link>
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => (
                        <CampaignCard
                            key={campaign.id}
                            campaign={campaign}
                            onDelete={handleDelete}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
