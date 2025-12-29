'use client'

import { useState } from 'react'
import { WhyDudeFeature } from '@/types/database'
import { createWhyDudeFeature, updateWhyDudeFeature, deleteWhyDudeFeature, reorderWhyDudeFeatures } from '@/lib/actions/why-dude'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { Plus, Edit, Trash2, GripVertical, Loader2 } from 'lucide-react'
import { ICON_OPTIONS, getIconComponent } from '@/lib/utils/icons'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'

interface WhyDudeManagementProps {
    initialFeatures: WhyDudeFeature[]
}

export function WhyDudeManagement({ initialFeatures }: WhyDudeManagementProps) {
    const [features, setFeatures] = useState<WhyDudeFeature[]>(initialFeatures)
    const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
    const [editingFeature, setEditingFeature] = useState<WhyDudeFeature | null>(null)
    const [loading, setLoading] = useState(false)

    const handleCreateFeature = async (formData: FormData) => {
        setLoading(true)
        try {
            const title = formData.get('title') as string
            const description = formData.get('description') as string
            const icon_name = formData.get('icon_name') as string

            await createWhyDudeFeature({
                title,
                description,
                icon_name,
                sort_order: features.length
            })

            // Refresh the page to get updated data
            window.location.reload()
            toast.success('Feature created successfully')
        } catch (error) {
            toast.error('Failed to create feature')
        } finally {
            setLoading(false)
        }
    }

    const handleUpdateFeature = async (id: string, formData: FormData) => {
        setLoading(true)
        try {
            const title = formData.get('title') as string
            const description = formData.get('description') as string
            const icon_name = formData.get('icon_name') as string
            const is_active = formData.get('is_active') === 'on'

            await updateWhyDudeFeature(id, {
                title,
                description,
                icon_name,
                is_active
            })

            // Update local state
            setFeatures(prev => prev.map(f =>
                f.id === id
                    ? { ...f, title, description, icon_name, is_active }
                    : f
            ))

            setEditingFeature(null)
            toast.success('Feature updated successfully')
        } catch (error) {
            toast.error('Failed to update feature')
        } finally {
            setLoading(false)
        }
    }

    const handleDeleteFeature = async (id: string) => {
        if (!confirm('Are you sure you want to delete this feature?')) return

        setLoading(true)
        try {
            await deleteWhyDudeFeature(id)
            setFeatures(prev => prev.filter(f => f.id !== id))
            toast.success('Feature deleted successfully')
        } catch (error) {
            toast.error('Failed to delete feature')
        } finally {
            setLoading(false)
        }
    }

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return

        const items = Array.from(features)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        // Update sort_order for all items
        const updatedItems = items.map((item, index) => ({
            ...item,
            sort_order: index
        }))

        setFeatures(updatedItems)

        try {
            await reorderWhyDudeFeatures(
                updatedItems.map(item => ({
                    id: item.id,
                    sort_order: item.sort_order
                }))
            )
            toast.success('Features reordered successfully')
        } catch (error) {
            toast.error('Failed to reorder features')
            // Revert on error
            setFeatures(initialFeatures)
        }
    }

    return (
        <div className="space-y-6">
            {/* Create New Feature Button */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-xl font-semibold">Features ({features.length})</h2>
                    <p className="text-sm text-gray-500">Drag to reorder features</p>
                </div>
                <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                    <DialogTrigger asChild>
                        <Button className="bg-red-600 hover:bg-red-700">
                            <Plus className="w-4 h-4 mr-2" />
                            Add Feature
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Create New Feature</DialogTitle>
                        </DialogHeader>
                        <FeatureForm onSubmit={handleCreateFeature} loading={loading} />
                    </DialogContent>
                </Dialog>
            </div>

            {/* Features List */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="features">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                            {features.map((feature, index) => (
                                <Draggable key={feature.id} draggableId={feature.id} index={index}>
                                    {(provided, snapshot) => (
                                        <Card
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className={`${snapshot.isDragging ? 'shadow-lg' : ''}`}
                                        >
                                            <CardHeader className="pb-4">
                                                <CardTitle className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3">
                                                        <div {...provided.dragHandleProps}>
                                                            <GripVertical className="w-5 h-5 text-gray-400 cursor-grab" />
                                                        </div>
                                                        <div className="p-2 bg-red-50 rounded-lg">
                                                            {(() => {
                                                                const IconComponent = getIconComponent(feature.icon_name)
                                                                return <IconComponent className="w-5 h-5 text-red-600" />
                                                            })()}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-medium">{feature.title}</h3>
                                                            <p className="text-sm text-gray-500">{feature.description}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={feature.is_active}
                                                            onCheckedChange={async (checked) => {
                                                                try {
                                                                    await updateWhyDudeFeature(feature.id, { is_active: checked })
                                                                    setFeatures(prev => prev.map(f =>
                                                                        f.id === feature.id ? { ...f, is_active: checked } : f
                                                                    ))
                                                                    toast.success(`Feature ${checked ? 'enabled' : 'disabled'}`)
                                                                } catch (error) {
                                                                    toast.error('Failed to update feature status')
                                                                }
                                                            }}
                                                        />
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => setEditingFeature(feature)}
                                                        >
                                                            <Edit className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="sm"
                                                            onClick={() => handleDeleteFeature(feature.id)}
                                                            disabled={loading}
                                                        >
                                                            <Trash2 className="w-4 h-4 text-red-600" />
                                                        </Button>
                                                    </div>
                                                </CardTitle>
                                            </CardHeader>
                                        </Card>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
            </DragDropContext>

            {/* Edit Feature Dialog */}
            <Dialog open={!!editingFeature} onOpenChange={() => setEditingFeature(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Edit Feature</DialogTitle>
                    </DialogHeader>
                    {editingFeature && (
                        <FeatureForm
                            feature={editingFeature}
                            onSubmit={(formData) => handleUpdateFeature(editingFeature.id, formData)}
                            loading={loading}
                        />
                    )}
                </DialogContent>
            </Dialog>
        </div>
    )
}

interface FeatureFormProps {
    feature?: WhyDudeFeature
    onSubmit: (formData: FormData) => void
    loading: boolean
}

function FeatureForm({ feature, onSubmit, loading }: FeatureFormProps) {
    const [iconValue, setIconValue] = useState(feature?.icon_name || 'badge-check')

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault()
        const formData = new FormData(e.currentTarget)
        onSubmit(formData)
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                    id="title"
                    name="title"
                    defaultValue={feature?.title}
                    placeholder="e.g., PREMIUM COTTON"
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    name="description"
                    defaultValue={feature?.description}
                    placeholder="e.g., 100% breathable fabric"
                    required
                />
            </div>

            <div className="grid gap-2">
                <Label htmlFor="icon_name">Icon</Label>
                <input type="hidden" name="icon_name" value={iconValue} />
                <Select value={iconValue} onValueChange={setIconValue}>
                    <SelectTrigger>
                        <SelectValue placeholder="Select an icon" />
                    </SelectTrigger>
                    <SelectContent>
                        {ICON_OPTIONS.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                                {option.label}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {feature && (
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                        <Label htmlFor="is_active">Active Status</Label>
                        <p className="text-sm text-gray-500">Show this feature on the homepage</p>
                    </div>
                    <Switch id="is_active" name="is_active" defaultChecked={feature.is_active} />
                </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
                <Button type="submit" disabled={loading} className="bg-red-600 hover:bg-red-700">
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    {feature ? 'Update Feature' : 'Create Feature'}
                </Button>
            </div>
        </form>
    )
}