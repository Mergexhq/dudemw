"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Camera, Save, Loader2, Lock, LogOut, User, Shield } from "lucide-react"
import { toast } from "sonner"

interface ProfileData {
  id: string
  email: string
  full_name: string
  avatar_url: string | null
  role?: string
  last_sign_in?: string
}

export default function ProfilePage() {
  const router = useRouter()
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    email: ""
  })

  // Password change state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [changingPassword, setChangingPassword] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()

      if (!user) {
        router.push('/admin/login')
        return
      }

      // Try to get profile from admin_profiles table first
      const { data: adminProfile } = await supabase
        .from('admin_profiles')
        .select('full_name, avatar_url, role')
        .eq('user_id', user.id)
        .single()

      const profileData: ProfileData = {
        id: user.id,
        email: user.email || "",
        full_name: adminProfile?.full_name || user.user_metadata?.full_name || "Admin User",
        avatar_url: adminProfile?.avatar_url || user.user_metadata?.avatar_url || null,
        role: adminProfile?.role || "Admin",
        last_sign_in: user.last_sign_in_at
      }

      setProfile(profileData)
      setFormData({
        full_name: profileData.full_name,
        email: profileData.email
      })
    } catch (error) {
      console.error('Error loading profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    try {
      setSaving(true)

      // Update auth user metadata
      const { error: authError } = await supabase.auth.updateUser({
        data: { full_name: formData.full_name }
      })

      if (authError) throw authError

      // Update admin_profiles table
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .update({
          full_name: formData.full_name,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.id)

      if (profileError) {
        console.error('Error updating admin_profiles:', profileError)
        // Don't throw - profile might not exist in admin_profiles yet
      }

      setProfile(prev => prev ? { ...prev, full_name: formData.full_name } : null)
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
    if (!file || !profile) return

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB')
      return
    }

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file')
      return
    }

    try {
      setUploading(true)

      // Create FormData for Cloudinary upload
      const formData = new FormData()
      formData.append('file', file)

      // Dynamic import to avoid bundling issues
      const { uploadImageAction } = await import('@/app/actions/media')

      // Upload to Cloudinary 'avatars' folder
      const result = await uploadImageAction(formData, 'avatars')

      if (!result.success) {
        toast.error(result.error || 'Failed to upload avatar')
        return
      }

      // Update auth user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: { avatar_url: result.url }
      })

      if (updateError) throw updateError

      // Update admin_profiles table
      const { error: profileError } = await supabase
        .from('admin_profiles')
        .update({
          avatar_url: result.url,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.id)

      if (profileError) {
        console.error('Error updating admin_profiles avatar:', profileError)
        // Don't throw - profile might not exist in admin_profiles yet
      }

      setProfile(prev => prev ? { ...prev, avatar_url: result.url || null } : null)
      toast.success('Avatar updated successfully')
    } catch (error) {
      console.error('Error uploading avatar:', error)
      toast.error('Failed to upload avatar. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }

    try {
      setChangingPassword(true)
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      toast.success('Password updated successfully')
    } catch (error) {
      console.error('Error changing password:', error)
      toast.error('Failed to change password')
    } finally {
      setChangingPassword(false)
    }
  }

  const handleLogoutAllSessions = async () => {
    try {
      await supabase.auth.signOut({ scope: 'global' })
      toast.success('Logged out from all sessions')
      router.push('/admin/login')
    } catch (error) {
      console.error('Error logging out:', error)
      toast.error('Failed to logout from all sessions')
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never'
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-red-600" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-gray-600">Failed to load profile</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Manage your personal information and account security</p>
      </div>

      {/* Account Info Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <User className="w-5 h-5 mr-2 text-red-600" />
            Account Information
          </CardTitle>
          <CardDescription>
            Your personal details and profile picture
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Avatar Section */}
          <div className="flex items-center space-x-6">
            <div className="relative">
              <Avatar className="h-20 w-20">
                <AvatarImage src={profile.avatar_url || undefined} alt={profile.full_name} />
                <AvatarFallback className="bg-red-100 text-red-700 text-lg font-semibold">
                  {getInitials(profile.full_name)}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute -bottom-1 -right-1 bg-white border-2 border-gray-200 rounded-full p-1.5 cursor-pointer hover:bg-gray-50 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="h-4 w-4 animate-spin text-gray-600" />
                ) : (
                  <Camera className="h-4 w-4 text-gray-600" />
                )}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={uploading}
                className="hidden"
              />
            </div>
            <div>
              <h3 className="font-medium text-gray-900">{profile.full_name}</h3>
              <p className="text-sm text-gray-600">{profile.email}</p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className="bg-red-100 text-red-700 border-red-200">{profile.role}</Badge>
                <span className="text-xs text-gray-500">Last login: {formatDate(profile.last_sign_in)}</span>
              </div>
            </div>
          </div>

          {/* Form Fields */}
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Enter your full name"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-50 text-gray-500"
              />
              <p className="text-xs text-gray-500">Email cannot be changed</p>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-red-600 hover:bg-red-700"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Security Card */}
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <Shield className="w-5 h-5 mr-2 text-red-600" />
            Security
          </CardTitle>
          <CardDescription>
            Manage your password and account security
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Change Password */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-4 h-4 text-gray-500" />
              <h4 className="font-medium text-gray-900">Change Password</h4>
            </div>
            <div className="grid gap-4 pl-6">
              <div className="grid gap-2">
                <Label htmlFor="current_password">Current Password</Label>
                <Input
                  id="current_password"
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="Enter current password"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="new_password">New Password</Label>
                  <Input
                    id="new_password"
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Enter new password"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="confirm_password">Confirm Password</Label>
                  <Input
                    id="confirm_password"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Confirm new password"
                  />
                </div>
              </div>
              <div className="flex justify-end">
                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  variant="outline"
                  className="hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                >
                  {changingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Password"
                  )}
                </Button>
              </div>
            </div>
          </div>

          {/* Logout All Sessions */}
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-between p-4 bg-amber-50 rounded-xl border border-amber-200">
              <div className="flex items-start space-x-3">
                <LogOut className="w-5 h-5 text-amber-600 mt-0.5" />
                <div>
                  <p className="font-medium text-gray-900">Logout from all devices</p>
                  <p className="text-sm text-gray-600">
                    This will sign you out from all browsers and devices
                  </p>
                </div>
              </div>
              <Button
                onClick={handleLogoutAllSessions}
                variant="outline"
                className="border-amber-300 text-amber-700 hover:bg-amber-100"
              >
                Logout All
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}