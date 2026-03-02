"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useUser, useClerk, useAuth } from "@clerk/nextjs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Camera, Save, Loader2, LogOut, User, Shield } from "lucide-react"
import { toast } from "sonner"
import { getAdminProfile } from "@/lib/admin-auth"

export default function ProfilePage() {
  const router = useRouter()
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const { userId } = useAuth()
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [adminRole, setAdminRole] = useState<string>("Admin")
  const [fullName, setFullName] = useState("")

  useEffect(() => {
    if (isLoaded && user) {
      setFullName(user.fullName || "")
      loadAdminRole()
    }
  }, [isLoaded, user])

  const loadAdminRole = async () => {
    if (!userId) return
    try {
      const response = await fetch('/api/admin/me')
      if (response.ok) {
        const data = await response.json()
        setAdminRole(data.role || "Admin")
      }
    } catch { }
  }

  const handleSave = async () => {
    if (!user) return
    try {
      setSaving(true)
      // Update Clerk user name
      await user.update({ firstName: fullName.split(' ')[0], lastName: fullName.split(' ').slice(1).join(' ') || undefined })
      // Update admin_profiles table via API
      await fetch('/api/admin/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: fullName }),
      })
      toast.success('Profile updated successfully')
    } catch (error) {
      console.error('Error updating profile:', error)
      toast.error('Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    if (file.size > 5 * 1024 * 1024) { toast.error('File size must be less than 5MB'); return }
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return }

    try {
      setUploading(true)
      const formData = new FormData()
      formData.append('file', file)
      const { uploadImageAction } = await import('@/app/actions/media')
      const result = await uploadImageAction(formData, 'avatars')
      if (!result.success) { toast.error(result.error || 'Failed to upload avatar'); return }
      // Update Clerk avatar
      await user.setProfileImage({ file })
      toast.success('Avatar updated successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleLogoutAllSessions = async () => {
    try {
      await signOut({ redirectUrl: '/admin/login' })
      toast.success('Logged out from all sessions')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to logout from all sessions')
    }
  }

  const getInitials = (name: string) =>
    name.split(' ').map(w => w.charAt(0)).join('').toUpperCase().slice(0, 2)

  const formatDate = (dateString?: string | Date | null) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return <div className="flex items-center justify-center min-h-[400px]"><p className="text-gray-600">Failed to load profile</p></div>
  }

  const email = user.emailAddresses?.[0]?.emailAddress || ""
  const avatarUrl = user.imageUrl

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and account security</p>
      </div>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <User className="w-5 h-5 mr-2 text-red-600" />
            Account Information
          </CardTitle>
          <CardDescription>Your personal details and profile picture</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={avatarUrl} alt={fullName} />
                <AvatarFallback className="bg-red-100 text-red-700 text-lg font-semibold">{getInitials(fullName || "AD")}</AvatarFallback>
              </Avatar>
              <label htmlFor="avatar-upload" className="absolute -bottom-1 -right-1 bg-white border-2 border-gray-200 rounded-full p-1.5 cursor-pointer hover:bg-gray-50 transition-colors">
                {uploading ? <Loader2 className="h-4 w-4 animate-spin text-gray-600" /> : <Camera className="h-4 w-4 text-gray-600" />}
              </label>
              <input id="avatar-upload" type="file" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} className="hidden" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{fullName}</h3>
              <p className="text-sm text-gray-600">{email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className="bg-red-100 text-red-700 border-red-200">{adminRole}</Badge>
                <span className="text-xs text-gray-500">Last login: {formatDate(user.lastSignInAt)}</span>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input id="full_name" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Enter your full name" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" type="email" value={email} disabled className="bg-gray-50 text-gray-500" />
              <p className="text-xs text-gray-500">Email is managed by Clerk. Update it from your account settings.</p>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSave} disabled={saving} className="bg-red-600 hover:bg-red-700">
              {saving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</> : <><Save className="mr-2 h-4 w-4" />Save Changes</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Shield className="w-5 h-5 mr-2 text-red-600" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security via Clerk</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-800">
              Password management is handled by <strong>Clerk</strong>. To change your password, visit your{" "}
              <a href="https://accounts.clerk.dev/user" className="underline font-medium" target="_blank" rel="noopener noreferrer">Clerk account settings</a>.
            </p>
          </div>

          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start space-x-3">
                <LogOut className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Logout from all devices</p>
                  <p className="text-sm text-gray-600">This will sign you out from all browsers and devices</p>
                </div>
              </div>
              <Button onClick={handleLogoutAllSessions} variant="outline" className="border-amber-300 text-amber-700 hover:bg-amber-100">
                Logout All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}