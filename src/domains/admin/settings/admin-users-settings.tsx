'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { createAdminUserAction, approveAdminAction, revokeAdminAction } from '@/lib/actions/admin-auth'
import { AdminRole } from '@/lib/admin-auth'
import { Shield, UserPlus, Mail, Lock, AlertCircle, CheckCircle, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

interface AdminUser {
  id: string
  user_id: string
  role: AdminRole
  is_active: boolean
  approved_by: string | null
  approved_at: string | null
  created_at: string
  email?: string
}

export function AdminUsersSettings() {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createForm, setCreateForm] = useState({
    email: '',
    role: 'staff' as AdminRole,
    temporaryPassword: ''
  })
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  const supabase = createClient()

  useEffect(() => {
    loadAdminUsers()
  }, [])

  const loadAdminUsers = async () => {
    try {
      setIsLoading(true)

      // Get current logged-in user first
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      // Get admin profiles using raw query since types might not be updated
      const { data: profiles, error: profilesError } = await supabase
        .from('admin_profiles' as any)
        .select('*')
        .order('created_at', { ascending: false })

      if (profilesError) {
        console.error('Error loading admin profiles:', profilesError.message)

        // If table doesn't exist or error, still show current user as super admin
        if (currentUser) {
          setAdminUsers([{
            id: currentUser.id,
            user_id: currentUser.id,
            role: 'super_admin',
            is_active: true,
            approved_by: null,
            approved_at: null,
            created_at: currentUser.created_at || new Date().toISOString(),
            email: currentUser.email || 'Admin User'
          }])
        }
        return
      }

      // Map profiles to AdminUser format
      let adminUsers: AdminUser[] = (profiles || []).map((profile: any) => ({
        id: profile.id,
        user_id: profile.user_id,
        role: profile.role,
        is_active: profile.is_active,
        approved_by: profile.approved_by,
        approved_at: profile.approved_at,
        created_at: profile.created_at,
        email: profile.email || 'Admin User'
      }))

      // If current user is not in list, add them as super admin
      if (currentUser && !adminUsers.find(u => u.user_id === currentUser.id)) {
        adminUsers = [{
          id: currentUser.id,
          user_id: currentUser.id,
          role: 'super_admin',
          is_active: true,
          approved_by: null,
          approved_at: null,
          created_at: currentUser.created_at || new Date().toISOString(),
          email: currentUser.email || 'Admin User'
        }, ...adminUsers]
      }

      setAdminUsers(adminUsers)
    } catch (error: any) {
      console.error('Error loading admin users:', error?.message || 'Unknown error')

      // Try to get current user as fallback
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (currentUser) {
        setAdminUsers([{
          id: currentUser.id,
          user_id: currentUser.id,
          role: 'super_admin',
          is_active: true,
          approved_by: null,
          approved_at: null,
          created_at: currentUser.created_at || new Date().toISOString(),
          email: currentUser.email || 'Admin User'
        }])
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsCreating(true)
    setError('')

    try {
      const result = await createAdminUserAction(
        createForm.email,
        createForm.role,
        createForm.temporaryPassword
      )

      if (!result.success) {
        setError(result.error || 'Failed to create admin user')
        toast.error(result.error || 'Failed to create admin user')
        return
      }

      toast.success('Admin user created successfully')
      setShowCreateModal(false)
      setCreateForm({ email: '', role: 'staff', temporaryPassword: '' })
      loadAdminUsers()
    } catch (error: any) {
      setError('An unexpected error occurred')
      toast.error('An unexpected error occurred')
    } finally {
      setIsCreating(false)
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

  const getRoleLabel = (role: AdminRole) => {
    return role.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Admin Users</h2>
          <p className="text-sm text-gray-600 mt-1">
            Manage admin access and permissions for your team
          </p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
          data-testid="create-admin-button"
        >
          <UserPlus className="w-4 h-4" />
          Create Admin User
        </button>
      </div>

      {/* Admin Users List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {isLoading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600 mx-auto"></div>
            <p className="text-gray-600 mt-2">Loading admin users...</p>
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {adminUsers.map((user) => (
                  <tr key={user.id} data-testid={`admin-user-row-${user.id}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                          <Shield className="h-5 w-5 text-red-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.email || 'Admin User'}
                          </div>
                          <div className="text-sm text-gray-500 font-mono">
                            {user.user_id.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                        {getRoleLabel(user.role)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {user.is_active ? (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800 border border-green-200">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Pending Approval
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {user.role !== 'super_admin' && (
                        <div className="flex items-center justify-end gap-2">
                          {!user.is_active ? (
                            <button
                              onClick={() => handleApprove(user.user_id)}
                              className="text-green-600 hover:text-green-900"
                              data-testid={`approve-admin-${user.id}`}
                            >
                              <CheckCircle className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={() => handleRevoke(user.user_id)}
                              className="text-red-600 hover:text-red-900"
                              data-testid={`revoke-admin-${user.id}`}
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

      {/* Create Admin Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Create Admin User
            </h3>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 mb-4">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </div>
            )}

            <form onSubmit={handleCreateAdmin} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    value={createForm.email}
                    onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    required
                    disabled={isCreating}
                    data-testid="create-admin-email"
                  />
                </div>
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Role
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as AdminRole })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                  disabled={isCreating}
                  data-testid="create-admin-role"
                >
                  <option value="staff">Staff</option>
                  <option value="manager">Manager</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              {/* Temporary Password */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Temporary Password
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    value={createForm.temporaryPassword}
                    onChange={(e) => setCreateForm({ ...createForm, temporaryPassword: e.target.value })}
                    placeholder="Generate a secure password"
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-600"
                    required
                    disabled={isCreating}
                    data-testid="create-admin-password"
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  The user will receive an email with this password
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setError('')
                    setCreateForm({ email: '', role: 'staff', temporaryPassword: '' })
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={isCreating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                  data-testid="create-admin-submit"
                >
                  {isCreating ? 'Creating...' : 'Create Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
} 