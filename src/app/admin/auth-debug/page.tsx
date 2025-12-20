"use client"

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from 'lucide-react'

export default function AuthDebugPage() {
  const [authState, setAuthState] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const checkAuth = async () => {
    setLoading(true)
    const supabase = createClient()
    
    try {
      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        setAuthState({ error: sessionError.message })
        setLoading(false)
        return
      }

      if (!session) {
        setAuthState({ notLoggedIn: true })
        setLoading(false)
        return
      }

      // Get user details
      const { data: { user }, error: userError } = await supabase.auth.getUser()
      
      if (userError) {
        setAuthState({ error: userError.message })
        setLoading(false)
        return
      }

      // Get admin profile from admin_profiles table
      const { data: adminProfile, error: profileError } = await supabase
        .from('admin_profiles')
        .select('*')
        .eq('user_id', user?.id)
        .single()

      // Check if can access storage
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets()

      setAuthState({
        user: {
          id: user?.id,
          email: user?.email,
          role: user?.user_metadata?.role, // Old system (not used for super admin)
          app_metadata: user?.app_metadata,
          user_metadata: user?.user_metadata,
        },
        adminProfile: adminProfile || null,
        profileError: profileError?.message,
        session: {
          access_token: session?.access_token?.substring(0, 20) + '...',
          expires_at: session?.expires_at,
        },
        storage: {
          canAccess: !bucketsError,
          buckets: buckets?.map(b => b.name),
          error: bucketsError?.message,
        }
      })
    } catch (err: any) {
      setAuthState({ error: err.message })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    checkAuth()
  }, [])

  const testUpload = async () => {
    const supabase = createClient()
    
    // Create a small test file
    const testFile = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    try {
      const { data, error } = await supabase.storage
        .from('categories')
        .upload(`test-${Date.now()}.txt`, testFile)
      
      if (error) {
        alert(`❌ Upload Failed: ${error.message}`)
      } else {
        alert(`✅ Upload Success! File: ${data.path}`)
        // Clean up
        await supabase.storage.from('categories').remove([data.path])
      }
    } catch (err: any) {
      alert(`❌ Upload Error: ${err.message}`)
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      </div>
    )
  }

  // Check admin role from admin_profiles (super admin system)
  const hasAdminRole = authState?.adminProfile?.is_active && 
    ['super_admin', 'admin', 'manager'].includes(authState?.adminProfile?.role)

  return (
    <div className="container mx-auto p-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Authentication Debug</h1>
          <p className="text-gray-500 mt-2">Check your Supabase authentication status</p>
        </div>
        <Button onClick={checkAuth} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Overall Status */}
      <Card className="border-2">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Overall Status</span>
            {authState?.user && hasAdminRole ? (
              <Badge className="bg-green-600 text-white flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Ready to Upload
              </Badge>
            ) : (
              <Badge className="bg-red-600 text-white flex items-center gap-1">
                <XCircle className="w-4 h-4" />
                Cannot Upload
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {authState?.notLoggedIn && (
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="w-5 h-5" />
                <span className="font-medium">Not Logged In</span>
              </div>
              <p className="text-sm text-yellow-700 mt-2">
                Please log in to your admin dashboard first.
              </p>
            </div>
          )}
          
          {authState?.error && (
            <div className="p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="flex items-center gap-2 text-red-800">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="text-sm text-red-700 mt-2 font-mono">{authState.error}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Admin Profile (Super Admin System) */}
      {authState?.user && (
        <Card>
          <CardHeader>
            <CardTitle>Admin Profile (Super Admin System)</CardTitle>
            <CardDescription>Your role from admin_profiles table</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {authState.adminProfile ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">Role</label>
                    <div className="flex items-center gap-2 mt-1">
                      {hasAdminRole ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-lg font-bold text-green-600">
                            {authState.adminProfile.role}
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="text-lg font-bold text-red-600">
                            {authState.adminProfile.role || 'NO ROLE'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">Status</label>
                    <div className="flex items-center gap-2 mt-1">
                      {authState.adminProfile.is_active ? (
                        <>
                          <CheckCircle2 className="w-5 h-5 text-green-600" />
                          <span className="text-lg font-bold text-green-600">Active</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="w-5 h-5 text-red-600" />
                          <span className="text-lg font-bold text-red-600">Inactive</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {!hasAdminRole && (
                  <div className="p-3 bg-red-50 rounded border border-red-200">
                    <p className="text-sm text-red-600">
                      ⚠️ Your admin profile is inactive or doesn't have upload permissions. 
                      Run the SQL fix script to update RLS policies.
                    </p>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-500">Profile Details</label>
                  <pre className="mt-1 p-3 bg-gray-100 rounded text-xs overflow-auto">
                    {JSON.stringify(authState.adminProfile, null, 2)}
                  </pre>
                </div>
              </>
            ) : (
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <div className="flex items-center gap-2 text-red-800">
                  <XCircle className="w-5 h-5" />
                  <span className="font-medium">No Admin Profile Found</span>
                </div>
                <p className="text-sm text-red-700 mt-2">
                  You're logged in but don't have an admin profile. This user may not have been created via the admin setup system.
                </p>
                {authState.profileError && (
                  <p className="text-xs text-red-600 mt-2 font-mono">{authState.profileError}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* User Details */}
      {authState?.user && (
        <Card className="bg-gray-50">
          <CardHeader>
            <CardTitle>User Information (Supabase Auth)</CardTitle>
            <CardDescription>Basic authentication details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Email</label>
                <p className="text-lg font-mono">{authState.user.email}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">User ID</label>
                <p className="text-sm font-mono text-gray-600">{authState.user.id}</p>
              </div>
            </div>

            {authState.user.user_metadata && Object.keys(authState.user.user_metadata).length > 0 && (
              <div>
                <label className="text-sm font-medium text-gray-500">User Metadata (Not used for super admin)</label>
                <pre className="mt-1 p-3 bg-gray-200 rounded text-xs overflow-auto">
                  {JSON.stringify(authState.user.user_metadata, null, 2)}
                </pre>
                <p className="text-xs text-gray-500 mt-1">
                  Note: Super admins use admin_profiles table, not user_metadata
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Session Details */}
      {authState?.session && (
        <Card>
          <CardHeader>
            <CardTitle>Session Information</CardTitle>
            <CardDescription>Your current JWT token details</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-500">Access Token (truncated)</label>
              <p className="text-sm font-mono text-gray-600 mt-1">{authState.session.access_token}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-500">Expires At</label>
              <p className="text-sm text-gray-600 mt-1">
                {authState.session.expires_at 
                  ? new Date(authState.session.expires_at * 1000).toLocaleString()
                  : 'Unknown'}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Storage Access */}
      {authState?.storage && (
        <Card>
          <CardHeader>
            <CardTitle>Storage Access</CardTitle>
            <CardDescription>Supabase Storage bucket access</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-2">
              {authState.storage.canAccess ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-600">Can access storage</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-600" />
                  <span className="font-medium text-red-600">Cannot access storage</span>
                </>
              )}
            </div>

            {authState.storage.buckets && (
              <div>
                <label className="text-sm font-medium text-gray-500">Available Buckets</label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {authState.storage.buckets.map((bucket: string) => (
                    <Badge key={bucket} variant="outline">{bucket}</Badge>
                  ))}
                </div>
              </div>
            )}

            {authState.storage.error && (
              <div className="p-3 bg-red-50 rounded border border-red-200">
                <p className="text-sm text-red-600 font-mono">{authState.storage.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Test Upload Button */}
      {authState?.user && hasAdminRole && (
        <Card className="border-2 border-green-200 bg-green-50">
          <CardHeader>
            <CardTitle className="text-green-800">Test Upload</CardTitle>
            <CardDescription>Click to test if you can upload to storage</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={testUpload} className="bg-green-600 hover:bg-green-700">
              Test Upload to Categories Bucket
            </Button>
            <p className="text-sm text-gray-600 mt-3">
              This will upload a small test file to verify RLS policies are working.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>Fix Instructions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          <p>If you see issues above, follow these steps:</p>
          <ol className="list-decimal list-inside space-y-2 ml-2">
            <li>Run <code className="bg-gray-100 px-2 py-1 rounded">/app/FIX_RLS_STORAGE_POLICIES.sql</code> in Supabase SQL Editor</li>
            <li>Log out from admin dashboard</li>
            <li>Clear browser cache (Ctrl+Shift+Delete)</li>
            <li>Log back in with your email</li>
            <li>Refresh this page to verify</li>
            <li>Check that your role shows as "admin"</li>
            <li>Click "Test Upload" button above</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  )
}
