'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import { Save, Loader2 } from 'lucide-react'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { updateCMSPage, type CMSPage } from '@/lib/actions/cms'
import dynamic from 'next/dynamic'
import 'react-quill-new/dist/quill.snow.css'

// Dynamically import ReactQuill to avoid SSR issues
const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false })

interface ShippingPolicyEditorProps {
    cmsPage: CMSPage | null
}

export default function ShippingPolicyEditor({ cmsPage }: ShippingPolicyEditorProps) {
    const [content, setContent] = useState(cmsPage?.content || '')
    const [isPublished, setIsPublished] = useState(cmsPage?.is_published ?? true)
    const [isSaving, setIsSaving] = useState(false)

    const modules = {
        toolbar: [
            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
            [{ 'size': ['small', false, 'large', 'huge'] }],
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'color': [] }, { 'background': [] }],
            [{ 'list': 'ordered' }, { 'list': 'bullet' }],
            [{ 'align': [] }],
            ['link'],
            ['clean']
        ],
    }

    const formats = [
        'header', 'size',
        'bold', 'italic', 'underline', 'strike',
        'color', 'background',
        'list',
        'align',
        'link'
    ]

    const handleSave = async () => {
        if (!cmsPage) {
            toast.error('CMS page not found')
            return
        }

        setIsSaving(true)
        try {
            await updateCMSPage('shipping-policy', {
                content,
                is_published: isPublished
            })
            toast.success('Shipping Policy saved successfully')
        } catch (error) {
            toast.error('Failed to save content')
        } finally {
            setIsSaving(false)
        }
    }

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="mb-6">
                <h1 className="text-2xl font-bold mb-2">Shipping Policy</h1>
                <p className="text-gray-600">Manage the content displayed on the Shipping Policy page</p>
            </div>

            <div className="bg-white border rounded-lg p-6 space-y-6">
                <div>
                    <Label htmlFor="shipping-content" className="text-base font-semibold mb-3 block">
                        Policy Content
                    </Label>
                    <p className="text-sm text-gray-500 mb-3">
                        Write and format your Shipping Policy using the rich text editor below.
                    </p>
                    <div className="border rounded-lg overflow-hidden">
                        <ReactQuill
                            theme="snow"
                            value={content}
                            onChange={setContent}
                            modules={modules}
                            formats={formats}
                            className="min-h-[400px]"
                            placeholder="Write your Shipping Policy here..."
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="space-y-0.5">
                        <Label htmlFor="is-published" className="font-medium">Published Status</Label>
                        <p className="text-sm text-gray-500">Make this content visible on the Shipping Policy page</p>
                    </div>
                    <Switch
                        id="is-published"
                        checked={isPublished}
                        onCheckedChange={setIsPublished}
                    />
                </div>

                <Button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="bg-red-600 hover:bg-red-700 text-white"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : (
                        <>
                            <Save className="w-4 h-4 mr-2" />
                            Save Content
                        </>
                    )}
                </Button>
            </div>
        </div>
    )
}
