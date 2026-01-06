'use client'

import { useState } from 'react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { Grip, Plus, Edit2, Trash2, Save, X, Loader2, Eye, EyeOff } from 'lucide-react'
import { toast } from 'sonner'
import {
    createFAQ,
    updateFAQ,
    deleteFAQ,
    reorderFAQs,
    type FAQ
} from '@/lib/actions/faq'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'

interface FAQManagementProps {
    initialFAQs: FAQ[]
}

export default function FAQManagement({ initialFAQs }: FAQManagementProps) {
    const [faqs, setFaqs] = useState<FAQ[]>(initialFAQs)
    const [isAdding, setIsAdding] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null)
    const [form, setForm] = useState({ title: '', question: '', answer: '', is_published: true })

    const handleCreate = async () => {
        if (!form.title || !form.question || !form.answer) {
            toast.error('Please fill in all fields')
            return
        }

        const result = await createFAQ({
            ...form,
            sort_order: faqs.length + 1
        })

        if (result.success && result.data) {
            setFaqs([...faqs, result.data])
            setForm({ title: '', question: '', answer: '', is_published: true })
            setIsAdding(false)
            toast.success('FAQ added successfully')
        } else {
            toast.error(result.error || 'Failed to add FAQ')
        }
    }

    const handleUpdate = async (id: string) => {
        const result = await updateFAQ(id, form)

        if (result.success && result.data) {
            setFaqs(faqs.map(f => f.id === id ? result.data! : f))
            setEditingId(null)
            setForm({ title: '', question: '', answer: '', is_published: true })
            toast.success('FAQ updated successfully')
        } else {
            toast.error(result.error || 'Failed to update FAQ')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this FAQ?')) return

        const result = await deleteFAQ(id)

        if (result.success) {
            setFaqs(faqs.filter(f => f.id !== id))
            toast.success('FAQ deleted successfully')
        } else {
            toast.error(result.error || 'Failed to delete FAQ')
        }
    }

    const handleDragEnd = async (result: any) => {
        if (!result.destination) return

        const items = Array.from(faqs)
        const [reorderedItem] = items.splice(result.source.index, 1)
        items.splice(result.destination.index, 0, reorderedItem)

        setFaqs(items)

        const orderedIds = items.map(item => item.id)
        await reorderFAQs(orderedIds)
        toast.success('FAQs reordered')
    }

    const togglePublished = async (id: string, currentStatus: boolean) => {
        const result = await updateFAQ(id, { is_published: !currentStatus })

        if (result.success && result.data) {
            setFaqs(faqs.map(f => f.id === id ? result.data! : f))
            toast.success(`FAQ ${!currentStatus ? 'published' : 'unpublished'}`)
        } else {
            toast.error('Failed to update FAQ status')
        }
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">FAQ Management</h1>
                <p className="text-gray-600">Manage frequently asked questions displayed on the FAQ page</p>
            </div>

            <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-500">Drag to reorder FAQs</p>
                <Button
                    onClick={() => setIsAdding(!isAdding)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add FAQ
                </Button>
            </div>

            {/* Add Form */}
            {isAdding && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold mb-3">New FAQ</h3>
                    <div className="space-y-3">
                        <div>
                            <Label>Title/Category</Label>
                            <Input
                                placeholder="e.g., Shipping, Returns, Payment"
                                value={form.title}
                                onChange={(e) => setForm({ ...form, title: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Question</Label>
                            <Input
                                placeholder="What is your return policy?"
                                value={form.question}
                                onChange={(e) => setForm({ ...form, question: e.target.value })}
                            />
                        </div>
                        <div>
                            <Label>Answer</Label>
                            <Textarea
                                placeholder="We offer a 30-day return policy..."
                                value={form.answer}
                                onChange={(e) => setForm({ ...form, answer: e.target.value })}
                                rows={4}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Switch
                                checked={form.is_published}
                                onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
                            />
                            <Label>Published</Label>
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={handleCreate} className="bg-red-600 hover:bg-red-700">
                                <Save className="w-4 h-4 mr-1" /> Save
                            </Button>
                            <Button
                                onClick={() => {
                                    setIsAdding(false)
                                    setForm({ title: '', question: '', answer: '', is_published: true })
                                }}
                                variant="outline"
                            >
                                <X className="w-4 h-4 mr-1" /> Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* FAQs List */}
            <DragDropContext onDragEnd={handleDragEnd}>
                <Droppable droppableId="faqs">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {faqs.map((faq, index) => (
                                <Draggable key={faq.id} draggableId={faq.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            className="bg-white border rounded-lg p-4"
                                        >
                                            {editingId === faq.id ? (
                                                <div className="space-y-3">
                                                    <Input
                                                        value={form.title}
                                                        onChange={(e) => setForm({ ...form, title: e.target.value })}
                                                        placeholder="Title"
                                                    />
                                                    <Input
                                                        value={form.question}
                                                        onChange={(e) => setForm({ ...form, question: e.target.value })}
                                                        placeholder="Question"
                                                    />
                                                    <Textarea
                                                        value={form.answer}
                                                        onChange={(e) => setForm({ ...form, answer: e.target.value })}
                                                        rows={4}
                                                        placeholder="Answer"
                                                    />
                                                    <div className="flex items-center gap-2">
                                                        <Switch
                                                            checked={form.is_published}
                                                            onCheckedChange={(checked) => setForm({ ...form, is_published: checked })}
                                                        />
                                                        <Label>Published</Label>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => handleUpdate(faq.id)}
                                                            size="sm"
                                                            className="bg-red-600 hover:bg-red-700"
                                                        >
                                                            Save
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                setEditingId(null)
                                                                setForm({ title: '', question: '', answer: '', is_published: true })
                                                            }}
                                                            size="sm"
                                                            variant="outline"
                                                        >
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-start gap-4">
                                                    <div
                                                        {...provided.dragHandleProps}
                                                        className="mt-1 cursor-grab active:cursor-grabbing"
                                                    >
                                                        <Grip className="w-5 h-5 text-gray-400" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2 mb-1">
                                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                                {faq.title}
                                                            </span>
                                                            {faq.is_published ? (
                                                                <Eye className="w-4 h-4 text-green-600" />
                                                            ) : (
                                                                <EyeOff className="w-4 h-4 text-gray-400" />
                                                            )}
                                                        </div>
                                                        <h3 className="font-semibold mb-1">{faq.question}</h3>
                                                        <p className="text-sm text-gray-600">{faq.answer}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            onClick={() => togglePublished(faq.id, faq.is_published)}
                                                            size="icon"
                                                            variant="ghost"
                                                            title={faq.is_published ? 'Unpublish' : 'Publish'}
                                                        >
                                                            {faq.is_published ? (
                                                                <EyeOff className="w-4 h-4" />
                                                            ) : (
                                                                <Eye className="w-4 h-4" />
                                                            )}
                                                        </Button>
                                                        <Button
                                                            onClick={() => {
                                                                setEditingId(faq.id)
                                                                setForm({
                                                                    title: faq.title,
                                                                    question: faq.question,
                                                                    answer: faq.answer,
                                                                    is_published: faq.is_published
                                                                })
                                                            }}
                                                            size="icon"
                                                            variant="ghost"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleDelete(faq.id)}
                                                            size="icon"
                                                            variant="ghost"
                                                            className="text-red-600 hover:bg-red-50"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </Button>
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

            {faqs.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                    <p className="text-gray-500">No FAQs yet. Add your first FAQ above!</p>
                </div>
            )}
        </div>
    )
}
