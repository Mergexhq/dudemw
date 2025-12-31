'use client'

import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Grip, Plus, Edit2, Trash2, Save, X, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import * as LucideIcons from 'lucide-react'
import {
    getAllAboutFeatures,
    createAboutFeature,
    updateAboutFeature,
    deleteAboutFeature,
    reorderAboutFeatures,
    getAllAboutStats,
    createAboutStat,
    updateAboutStat,
    deleteAboutStat,
    reorderAboutStats
} from '@/lib/actions/about'
import { updateCMSPage, CMSPage } from '@/lib/actions/cms'
import type { AboutFeature, AboutStat } from '@/types/database'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

type TabType = 'content' | 'features' | 'statistics'

export default function AboutManagement({
    initialFeatures,
    initialStats,
    cmsPage
}: {
    initialFeatures: AboutFeature[]
    initialStats: AboutStat[]
    cmsPage: CMSPage | null
}) {
    const [activeTab, setActiveTab] = useState<TabType>('content')
    
    // CMS Content state
    const [cmsContent, setCmsContent] = useState(cmsPage?.content || '')
    const [isPublished, setIsPublished] = useState(cmsPage?.is_published ?? true)
    const [isSavingCMS, setIsSavingCMS] = useState(false)

    // Features state
    const [features, setFeatures] = useState<AboutFeature[]>(initialFeatures)
    const [isAddingFeature, setIsAddingFeature] = useState(false)
    const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null)
    const [featureForm, setFeatureForm] = useState({ title: '', description: '', icon_name: 'Heart' })

    // Stats state
    const [stats, setStats] = useState<AboutStat[]>(initialStats)
    const [isAddingStat, setIsAddingStat] = useState(false)
    const [editingStatId, setEditingStatId] = useState<string | null>(null)
    const [statForm, setStatForm] = useState({ value: '', label: '' })

    // Popular icon names
    const iconOptions = ['Heart', 'Users', 'Award', 'TrendingUp', 'Star', 'Zap', 'Shield', 'Target', 'Gift', 'Sparkles']

    // ============= CMS CONTENT HANDLERS =============
    
    const handleSaveCMSContent = async () => {
        if (!cmsPage) {
            toast.error('CMS page not found')
            return
        }

        setIsSavingCMS(true)
        try {
            await updateCMSPage('about-us', {
                content: cmsContent,
                is_published: isPublished
            })
            toast.success('Content saved successfully')
        } catch (error) {
            toast.error('Failed to save content')
        } finally {
            setIsSavingCMS(false)
        }
    }

    // ============= FEATURES HANDLERS =============

    const handleCreateFeature = async () => {
        if (!featureForm.title || !featureForm.description) {
            toast.error('Please fill in all fields')
            return
        }

        const result = await createAboutFeature({
            ...featureForm,
            sort_order: features.length + 1
        })

        if (result.success && result.data) {
            setFeatures([...features, result.data])
            setFeatureForm({ title: '', description: '', icon_name: 'Heart' })
            setIsAddingFeature(false)
            toast.success('Feature added successfully')
        } else {
            toast.error(result.error || 'Failed to add feature')
        }
    }

    const handleUpdateFeature = async (id: string) => {
        const result = await updateAboutFeature(id, featureForm)

        if (result.success && result.data) {
            setFeatures(features.map(f => f.id === id ? result.data! : f))
            setEditingFeatureId(null)
            setFeatureForm({ title: '', description: '', icon_name: 'Heart' })
            toast.success('Feature updated successfully')
        } else {
            toast.error(result.error || 'Failed to update feature')
        }
    }

    const handleDeleteFeature = async (id: string) => {
        if (!confirm('Are you sure you want to delete this feature?')) return

        const result = await deleteAboutFeature(id)

        if (result.success) {
            setFeatures(features.filter(f => f.id !== id))
            toast.success('Feature deleted successfully')
        } else {
            toast.error(result.error || 'Failed to delete feature')
        }
    }

    const handleFeatureDragEnd = async (result: any) => {
        if (!result.destination) return

        const items = Array.from(features)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        setFeatures(items)

        const orderedIds = items.map(item => item.id)
        await reorderAboutFeatures(orderedIds)
        toast.success('Features reordered')
    }

    // ============= STATS HANDLERS =============

    const handleCreateStat = async () => {
        if (!statForm.value || !statForm.label) {
            toast.error('Please fill in all fields')
            return
        }

        const result = await createAboutStat({
            ...statForm,
            sort_order: stats.length + 1
        })

        if (result.success && result.data) {
            setStats([...stats, result.data])
            setStatForm({ value: '', label: '' })
            setIsAddingStat(false)
            toast.success('Statistic added successfully')
        } else {
            toast.error(result.error || 'Failed to add statistic')
        }
    }

    const handleUpdateStat = async (id: string) => {
        const result = await updateAboutStat(id, statForm)

        if (result.success && result.data) {
            setStats(stats.map(s => s.id === id ? result.data! : s))
            setEditingStatId(null)
            setStatForm({ value: '', label: '' })
            toast.success('Statistic updated successfully')
        } else {
            toast.error(result.error || 'Failed to update statistic')
        }
    }

    const handleDeleteStat = async (id: string) => {
        if (!confirm('Are you sure you want to delete this statistic?')) return

        const result = await deleteAboutStat(id)

        if (result.success) {
            setStats(stats.filter(s => s.id !== id))
            toast.success('Statistic deleted successfully')
        } else {
            toast.error(result.error || 'Failed to delete statistic')
        }
    }

    const handleStatDragEnd = async (result: any) => {
        if (!result.destination) return

        const items = Array.from(stats)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        setStats(items)

        const orderedIds = items.map(item => item.id)
        await reorderAboutStats(orderedIds)
        toast.success('Statistics reordered')
    }

    const getIconComponent = (iconName: string) => {
        const IconComponent = (LucideIcons as any)[iconName] || LucideIcons.Heart
        return <IconComponent className="w-5 h-5" />
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">About Us Management</h1>
                <p className="text-gray-600">Manage content, features and statistics displayed on the About page</p>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6 border-b">
                <button
                    onClick={() => setActiveTab('content')}
                    className={`px-4 py-2 font-medium transition ${activeTab === 'content'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Content
                </button>
                <button
                    onClick={() => setActiveTab('features')}
                    className={`px-4 py-2 font-medium transition ${activeTab === 'features'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Features ({features.length})
                </button>
                <button
                    onClick={() => setActiveTab('statistics')}
                    className={`px-4 py-2 font-medium transition ${activeTab === 'statistics'
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Statistics ({stats.length})
                </button>
            </div>

            {/* Content Tab */}
            {activeTab === 'content' && (
                <div className="space-y-6">
                    <div className="bg-white border rounded-lg p-6">
                        <div className="space-y-4">
                            <div>
                                <Label htmlFor="cms-content" className="text-base font-semibold mb-2 block">
                                    Our Story Content
                                </Label>
                                <p className="text-sm text-gray-500 mb-3">
                                    Write the content for the "Our Story" section. Supports Markdown formatting.
                                </p>
                                <Textarea
                                    id="cms-content"
                                    value={cmsContent}
                                    onChange={(e) => setCmsContent(e.target.value)}
                                    className="min-h-[300px] font-mono text-sm"
                                    placeholder="Enter your about content here (Markdown supported)..."
                                />
                            </div>

                            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div className="space-y-0.5">
                                    <Label htmlFor="is-published" className="font-medium">Published Status</Label>
                                    <p className="text-sm text-gray-500">Make this content visible on the About page</p>
                                </div>
                                <Switch 
                                    id="is-published" 
                                    checked={isPublished}
                                    onCheckedChange={setIsPublished}
                                />
                            </div>

                            <button 
                                onClick={handleSaveCMSContent}
                                disabled={isSavingCMS}
                                className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isSavingCMS ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Save className="w-4 h-4" />
                                )}
                                {isSavingCMS ? 'Saving...' : 'Save Content'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Features Tab */}
            {activeTab === 'features' && (
                            ? 'text-blue-600 border-b-2 border-blue-600'
                            : 'text-gray-600 hover:text-gray-900'
                        }`}
                >
                    Statistics ({stats.length})
                </button>
            </div>

            {/* Features Tab */}
            {activeTab === 'features' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">Drag to reorder features</p>
                        <button
                            onClick={() => setIsAddingFeature(!isAddingFeature)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add Feature
                        </button>
                    </div>

                    {/* Add Form */}
                    {isAddingFeature && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold mb-3">New Feature</h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Title"
                                    value={featureForm.title}
                                    onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                                <textarea
                                    placeholder="Description"
                                    value={featureForm.description}
                                    onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg resize-none"
                                    rows={2}
                                />
                                <div>
                                    <label className="block text-sm font-medium mb-1">Icon</label>
                                    <select
                                        value={featureForm.icon_name}
                                        onChange={(e) => setFeatureForm({ ...featureForm, icon_name: e.target.value })}
                                        className="w-full px-3 py-2 border rounded-lg"
                                    >
                                        {iconOptions.map(icon => (
                                            <option key={icon} value={icon}>{icon}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={handleCreateFeature} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        <Save className="w-4 h-4 inline mr-1" /> Save
                                    </button>
                                    <button onClick={() => {
                                        setIsAddingFeature(false)
                                        setFeatureForm({ title: '', description: '', icon_name: 'Heart' })
                                    }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                        <X className="w-4 h-4 inline mr-1" /> Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Features List */}
                    <DragDropContext onDragEnd={handleFeatureDragEnd}>
                        <Droppable droppableId="features">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                    {features.map((feature, index) => (
                                        <Draggable key={feature.id} draggableId={feature.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="bg-white border rounded-lg p-4"
                                                >
                                                    {editingFeatureId === feature.id ? (
                                                        <div className="space-y-3">
                                                            <input
                                                                type="text"
                                                                value={featureForm.title}
                                                                onChange={(e) => setFeatureForm({ ...featureForm, title: e.target.value })}
                                                                className="w-full px-3 py-2 border rounded-lg"
                                                            />
                                                            <textarea
                                                                value={featureForm.description}
                                                                onChange={(e) => setFeatureForm({ ...featureForm, description: e.target.value })}
                                                                className="w-full px-3 py-2 border rounded-lg"
                                                                rows={2}
                                                            />
                                                            <select
                                                                value={featureForm.icon_name}
                                                                onChange={(e) => setFeatureForm({ ...featureForm, icon_name: e.target.value })}
                                                                className="w-full px-3 py-2 border rounded-lg"
                                                            >
                                                                {iconOptions.map(icon => (
                                                                    <option key={icon} value={icon}>{icon}</option>
                                                                ))}
                                                            </select>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleUpdateFeature(feature.id)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                                                    Save
                                                                </button>
                                                                <button onClick={() => {
                                                                    setEditingFeatureId(null)
                                                                    setFeatureForm({ title: '', description: '', icon_name: 'Heart' })
                                                                }} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-start gap-4">
                                                            <div {...provided.dragHandleProps} className="mt-1 cursor-grab active:cursor-grabbing">
                                                                <Grip className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-2 mb-1">
                                                                    {getIconComponent(feature.icon_name)}
                                                                    <h3 className="font-semibold">{feature.title}</h3>
                                                                </div>
                                                                <p className="text-sm text-gray-600">{feature.description}</p>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingFeatureId(feature.id)
                                                                        setFeatureForm({
                                                                            title: feature.title,
                                                                            description: feature.description,
                                                                            icon_name: feature.icon_name
                                                                        })
                                                                    }}
                                                                    className="p-2 hover:bg-gray-100 rounded"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteFeature(feature.id)}
                                                                    className="p-2 hover:bg-red-50 text-red-600 rounded"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {features.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No features yet. Add your first feature above!</p>
                        </div>
                    )}
                </div>
            )}

            {/* Statistics Tab */}
            {activeTab === 'statistics' && (
                <div>
                    <div className="flex justify-between items-center mb-4">
                        <p className="text-sm text-gray-500">Drag to reorder statistics</p>
                        <button
                            onClick={() => setIsAddingStat(!isAddingStat)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add Statistic
                        </button>
                    </div>

                    {/* Add Form */}
                    {isAddingStat && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                            <h3 className="font-semibold mb-3">New Statistic</h3>
                            <div className="space-y-3">
                                <input
                                    type="text"
                                    placeholder="Value (e.g., 50K+, 4.8, 100%)"
                                    value={statForm.value}
                                    onChange={(e) => setStatForm({ ...statForm, value: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                                <input
                                    type="text"
                                    placeholder="Label (e.g., Happy Customers)"
                                    value={statForm.label}
                                    onChange={(e) => setStatForm({ ...statForm, label: e.target.value })}
                                    className="w-full px-3 py-2 border rounded-lg"
                                />
                                <div className="flex gap-2">
                                    <button onClick={handleCreateStat} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                                        <Save className="w-4 h-4 inline mr-1" /> Save
                                    </button>
                                    <button onClick={() => {
                                        setIsAddingStat(false)
                                        setStatForm({ value: '', label: '' })
                                    }} className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300">
                                        <X className="w-4 h-4 inline mr-1" /> Cancel
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Stats List */}
                    <DragDropContext onDragEnd={handleStatDragEnd}>
                        <Droppable droppableId="stats">
                            {(provided) => (
                                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                                    {stats.map((stat, index) => (
                                        <Draggable key={stat.id} draggableId={stat.id} index={index}>
                                            {(provided) => (
                                                <div
                                                    ref={provided.innerRef}
                                                    {...provided.draggableProps}
                                                    className="bg-white border rounded-lg p-4"
                                                >
                                                    {editingStatId === stat.id ? (
                                                        <div className="space-y-3">
                                                            <input
                                                                type="text"
                                                                value={statForm.value}
                                                                onChange={(e) => setStatForm({ ...statForm, value: e.target.value })}
                                                                className="w-full px-3 py-2 border rounded-lg"
                                                            />
                                                            <input
                                                                type="text"
                                                                value={statForm.label}
                                                                onChange={(e) => setStatForm({ ...statForm, label: e.target.value })}
                                                                className="w-full px-3 py-2 border rounded-lg"
                                                            />
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleUpdateStat(stat.id)} className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
                                                                    Save
                                                                </button>
                                                                <button onClick={() => {
                                                                    setEditingStatId(null)
                                                                    setStatForm({ value: '', label: '' })
                                                                }} className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300">
                                                                    Cancel
                                                                </button>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-4">
                                                            <div {...provided.dragHandleProps} className="cursor-grab active:cursor-grabbing">
                                                                <Grip className="w-5 h-5 text-gray-400" />
                                                            </div>
                                                            <div className="flex-1">
                                                                <div className="text-2xl font-bold text-red-600">{stat.value}</div>
                                                                <div className="text-sm text-gray-600">{stat.label}</div>
                                                            </div>
                                                            <div className="flex gap-2">
                                                                <button
                                                                    onClick={() => {
                                                                        setEditingStatId(stat.id)
                                                                        setStatForm({
                                                                            value: stat.value,
                                                                            label: stat.label
                                                                        })
                                                                    }}
                                                                    className="p-2 hover:bg-gray-100 rounded"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDeleteStat(stat.id)}
                                                                    className="p-2 hover:bg-red-50 text-red-600 rounded"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </Draggable>
                                    ))}
                                    {provided.placeholder}
                                </div>
                            )}
                        </Droppable>
                    </DragDropContext>

                    {stats.length === 0 && (
                        <div className="text-center py-12 bg-gray-50 rounded-lg">
                            <p className="text-gray-500">No statistics yet. Add your first statistic above!</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
