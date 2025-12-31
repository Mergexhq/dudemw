'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { approveAdminAction, revokeAdminAction } from '@/lib/actions/admin-auth'
import { AdminRole } from '@/lib/admin-auth'
import { Shield, UserPlus, Mail, CheckCircle, XCircle, Clock, Send, Ban, RefreshCw, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DialogSelect } from "@/components/ui/dialog-select"

interface AdminUser {
  id: string
  user_id: string
  role: AdminRole
  name: string | null
  is_active: boolean
  last_login: string | null
  approved_by: string | null
  approved_at: string | null
  created_at: string
  email?: string
}

interface Invite {
  id: string
  email: string
  role: string
  expires_at: string
  used_at: string | null
  created_at: string
}

export function AdminUsersSettings() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [invites, setInvites] = useState<Invite[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteSuccessData, setInviteSuccessData] = useState<{ url: string, email: string } | null>(null)
  const [inviteForm, setInviteForm] = useState({
    email: '',
    role: 'staff' as AdminRole
  })
  const [isInviting, setIsInviting] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    await Promise.all([loadAdminUsers(), loadInvites()])
  }

  const loadAdminUsers = async () => {
    try {
      setIsLoading(true)

      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // Get admin profiles with user emails
      const { data: profiles, error: profilesError } = await supabase
        .from('admin_profiles' as any)
        .select('*')
        .is('deleted_at', null) // Only active (not soft-deleted)
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error loading admin profiles:', profilesError)
        if (currentUser) {
          setAdminUsers([{
            id: currentUser.id,
            user_id: currentUser.id,
            role: 'super_admin',
            name: null,
            is_active: true,
            last_login: null,
            approved_by: null,
            approved_at: null,
            created_at: currentUser.created_at || new Date().toISOString(),
            email: currentUser.email || 'Admin User'
          }])
        }
        return
      }

      // Get emails from auth.users
      let adminUsers: AdminUser[] = []

      // Cast profiles to known type
      const typedProfiles = (profiles || []) as unknown as AdminUser[]

      for (const profile of typedProfiles) {
        // Safe access to user_id
        if (!profile.user_id) continue

        const { data: authUser } = await supabase.auth.admin.getUserById(profile.user_id)
        adminUsers.push({
          id: profile.id,
          user_id: profile.user_id,
          role: profile.role,
          name: profile.name,
          is_active: profile.is_active,
          last_login: profile.last_login,
          approved_by: profile.approved_by,
          approved_at: profile.approved_at,
          created_at: profile.created_at,
          email: authUser?.user?.email || 'Unknown'
        })
      }

      // If current user not in list, add them
      if (currentUser && !adminUsers.find(u => u.user_id === currentUser.id)) {
        adminUsers = [{
          id: currentUser.id,
          user_id: currentUser.id,
          role: 'super_admin',
          name: null,
          is_active: true,
          last_login: null,
          approved_by: null,
          approved_at: null,
          created_at: currentUser.created_at || new Date().toISOString(),
          email: currentUser.email || 'Admin User'
        }, ...adminUsers]
      }

      setAdminUsers(adminUsers)
    } catch (error: any) {
      console.error('Error loading admin users:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadInvites = async () => {
    try {
      const response = await fetch('/api/admin/invites')
      const data = await response.json()

      if (data.success) {
        setInvites(data.invites || [])
      }
    } catch (error) {
      console.error('Error loading invites:', error)
    }
  }

  const handleInviteAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsInviting(true)
    setError('')

    try {
      const response = await fetch('/api/admin/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: inviteForm.email,
          role: inviteForm.role
        })
      })

      const data = await response.json()

      if (data.success) {
        if (data.emailSuccess) {
          toast.success('Invite sent successfully!')
          setShowInviteModal(false)
          setInviteForm({ email: '', role: 'staff' })
        } else {
          toast.warning('Invite created, but email failed to send.')
          setInviteSuccessData({ url: data.inviteUrl, email: inviteForm.email })
          // Don't close modal, we'll switch content
        }
        loadInvites()
      } else {
        setError(data.error || 'Failed to send invite')
        toast.error(data.error || 'Failed to send invite')
      }
    } catch (error: any) {
      setError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      setIsInviting(false)
    }
  }

  const handleResendInvite = async (inviteId: string) => {
    try {
      const response = await fetch(`/api/admin/invites/${inviteId}/resend`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Invite resent successfully!')
        loadInvites()
      } else {
        toast.error(data.error || 'Failed to resend invite')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const handleRevokeInvite = async (inviteId: string) => {
    if (!confirm('Are you sure you want to revoke this invite?')) {
      return
    }

    try {
      const response = await fetch(`/api/admin/invites/${inviteId}/revoke`, {
        method: 'POST'
      })

      const data = await response.json()

      if (data.success) {
        toast.success('Invite revoked successfully!')
        loadInvites()
      } else {
        toast.error(data.error || 'Failed to revoke invite')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const handleApprove = async (userId: string) => {
    try {
      const result = await approveAdminAction(userId)
      if (!result.success) {
        toast.error(result.error || 'Failed to approve user')
        return
      }
      toast.success('Admin user approved successfully')
      loadAdminUsers()
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const handleRevoke = async (userId: string) => {
    if (!confirm('Are you sure you want to revoke this admin\'s access?')) {
      return
    }

    try {
      const result = await revokeAdminAction(userId)
      if (!result.success) {
        toast.error(result.error || 'Failed to revoke access')
        return
      }
      toast.success('Admin access revoked successfully')
      loadAdminUsers()
    } catch (error) {
      toast.error('An unexpected error occurred')
    }
  }

  const getRoleBadgeColor = (role: AdminRole) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'manager':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'staff':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getRoleLabel = (role: AdminRole | string) => {
    return role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const isInviteExpired = (expiresAt: string) => {
    return new Date(expiresAt) < new Date()
  }

  const isPendingInvite = (invite: Invite) => {
    return !invite.used_at && !isInviteExpired(invite.expires_at)
  }

  const pendingInvites = invites.filter(isPendingInvite)
  const expiredInvites = invites.filter(i => !i.used_at && isInviteExpired(i.expires_at))
  const acceptedInvites = invites.filter(i => i.used_at)

  return (
    <div className="space-y-6">
      {/* Invite Button */}
      <div className="flex items-center justify-end">
        <button
          onClick={() => setShowInviteModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
        >
          <UserPlus className="w-4 h-4" />
          Invite Admin User
        </button>
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-yellow-900 mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Pending Invites ({pendingInvites.length})
          </h3>
          <div className="space-y-2">
            {pendingInvites.map((invite) => (
              <div key={invite.id} className="flex items-center justify-between bg-white rounded p-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{invite.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full border ${getRoleBadgeColor(invite.role as AdminRole)}`}>
                      {getRoleLabel(invite.role)}
                    </span>
                    <span className="text-xs text-gray-500">
                      Expires {new Date(invite.expires_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleResendInvite(invite.id)}
                    className="text-blue-600 hover:text-blue-700 p-1"
                    title="Resend invite"
                  >
                    <RefreshCw className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="text-red-600 hover:text-red-700 p-1"
                    title="Revoke invite"
                  >
                    <Ban className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin Users List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2 text-red-600" />
            <p className="text-gray-600">Loading admin users...</p>
          </div>
        ) : adminUsers.length === 0 ? (
          <div className="p-8 text-center">
            <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-600">No admin users found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Role</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Last Login</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || user.email}
                          </div>
                          {user.name && (
                            <div className="text-sm text-gray-500">{user.email}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {user.is_active ? (
                        <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex items-center text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {user.last_login ? new Date(user.last_login).toLocaleString() : 'Never'}
                    </td>
                    <td className="px-6 py-4 text-right text-sm font-medium">
                      {user.role !== 'super_admin' && (
                        <div className="flex items-center justify-end gap-2">
                          {!user.is_active ? (
                            <button
                              onClick={() => handleApprove(user.user_id)}
                              className="text-green-600 hover:text-green-900"
                              title="Approve"
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevoke(user.user_id)}
                              className="text-red-600 hover:text-red-900"
                              title="Revoke access"
                            >
                              <XCircle className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Invite Modal */}
      <Dialog open={showInviteModal} onOpenChange={setShowInviteModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invite Admin User</DialogTitle>
          </DialogHeader>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {inviteSuccessData ? (
            <div className="space-y-4">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-2 text-yellow-800 mb-2">
                  <Clock className="w-5 h-5" />
                  <h4 className="font-semibold">Email Delivery Failed</h4>
                </div>
                <p className="text-sm text-yellow-700 mb-2">
                  The invite was created, but we couldn't send the email to <strong>{inviteSuccessData.email}</strong>.
                </p>
                <p className="text-sm text-yellow-700">
                  Please copy the link below and send it to the user manually:
                </p>
              </div>

              <div className="relative">
                <input
                  type="text"
                  readOnly
                  value={inviteSuccessData.url}
                  className="w-full pr-24 pl-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600 font-mono text-sm"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(inviteSuccessData.url)
                    toast.success('Link copied to clipboard')
                  }}
                  className="absolute right-1 top-1 bottom-1 px-3 bg-white border border-gray-200 rounded text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
                >
                  Copy Link
                </button>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => {
                    setShowInviteModal(false)
                    setInviteSuccessData(null)
                    setInviteForm({ email: '', role: 'staff' })
                  }}
                  className="w-full px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInviteAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 z-10" />
                  <input
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) => setInviteForm({ ...inviteForm, email: e.target.value })}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    required
                    disabled={isInviting}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <DialogSelect
                  value={inviteForm.role}
                  onValueChange={(value) => setInviteForm({ ...inviteForm, role: value as AdminRole })}
                  options={[
                    { value: 'staff', label: 'Staff' },
                    { value: 'manager', label: 'Manager' },
                    { value: 'admin', label: 'Admin' }
                  ]}
                  placeholder="Select a role"
                />
                <p className="text-xs text-gray-500 mt-1">
                  The user will receive an email with a secure invite link
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowInviteModal(false)
                    setError('')
                    setInviteForm({ email: '', role: 'staff' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isInviting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isInviting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isInviting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Send Invite
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}