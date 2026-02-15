'use client'

import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { User, Mail, Upload, X } from 'lucide-react'
import { useAuth } from '@/domains/auth/context'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

interface ProfileEditDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export default function ProfileEditDialog({ open, onOpenChange }: ProfileEditDialogProps) {
    const { user, updateUser } = useAuth()
    const [formData, setFormData] = useState({
        name: user?.name || '',
        email: user?.email || '',
        profilePicture: user?.profilePicture || ''
    })
    const [uploading, setUploading] = useState(false)
    const [saving, setSaving] = useState(false)

    const handleSave = async () => {
        try {
            setSaving(true)

            // Update Supabase auth user metadata
            const supabase = createClient()
            const { error } = await supabase.auth.updateUser({
                email: formData.email,
                data: {
                    full_name: formData.name,
                    profile_picture: formData.profilePicture
                }
            })

            if (error) throw error

            // Also update local context
            await updateUser?.(formData)

            toast.success('Profile updated successfully')
            onOpenChange(false)
        } catch (error: any) {
            console.error('Error updating profile:', error)
            toast.error(error.message || 'Failed to update profile')
        } finally {
            setSaving(false)
        }
    }

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        // Check file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
            toast.error('Image size should be less than 5MB')
            return
        }

        try {
            setUploading(true)
            const uploadFormData = new FormData()
            uploadFormData.append('file', file)
            uploadFormData.append('folder', 'profiles')

            const response = await fetch('/api/admin/banners/upload', {
                method: 'POST',
                body: uploadFormData,
            })

            if (!response.ok) throw new Error('Upload failed')

            const data = await response.json()
            setFormData(prev => ({ ...prev, profilePicture: data.url }))
            toast.success('Profile picture uploaded')
        } catch (error) {
            console.error('Error uploading image:', error)
            toast.error('Failed to upload image')
        } finally {
            setUploading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Edit Profile</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    {/* Profile Picture */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative">
                            <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {formData.profilePicture ? (
                                    <img
                                        src={formData.profilePicture}
                                        alt="Profile"
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <User className="w-12 h-12 text-gray-400" />
                                )}
                            </div>
                            {formData.profilePicture && (
                                <button
                                    onClick={() => setFormData(prev => ({ ...prev, profilePicture: '' }))}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                        <label className="cursor-pointer">
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="hidden"
                                disabled={uploading}
                            />
                            <div className="flex items-center gap-2 text-sm text-gray-600 hover:text-black">
                                <Upload className="w-4 h-4" />
                                {uploading ? 'Uploading...' : 'Upload Picture'}
                            </div>
                        </label>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="name">
                            <User className="w-4 h-4 inline mr-2" />
                            Full Name
                        </Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Enter your name"
                        />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                        <Label htmlFor="email">
                            <Mail className="w-4 h-4 inline mr-2" />
                            Email Address
                        </Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="Enter your email"
                        />
                    </div>
                </div>

                <div className="flex gap-3 justify-end">
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                        disabled={saving || uploading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        className="bg-black hover:bg-gray-800"
                        disabled={saving || uploading}
                    >
                        {saving ? 'Saving...' : 'Save Changes'}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    )
}
