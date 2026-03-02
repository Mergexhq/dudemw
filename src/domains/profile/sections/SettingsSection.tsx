'use client'

import { useState } from 'react'
import { useUser, useClerk } from '@clerk/nextjs'
import { useRouter } from 'next/navigation'
import { Lock, Trash2, LogOut, Eye, EyeOff, AlertCircle, CheckCircle, KeyRound } from 'lucide-react'

export default function SettingsSection() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerk()
  const router = useRouter()

  // Detect if the user signed in via Google (no password set)
  const hasPassword = user?.passwordEnabled ?? false
  const isGoogleUser = !hasPassword && (user?.externalAccounts?.some(a => a.provider === 'google') ?? false)

  // ── Password form state ──
  const [pwForm, setPwForm] = useState({
    current: '',
    newPw: '',
    confirm: '',
  })
  const [showCurrent, setShowCurrent] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [pwLoading, setPwLoading] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState('')
  const [pwOpen, setPwOpen] = useState(false)

  // ── Delete account state ──
  const [deleteConfirm, setDeleteConfirm] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [showDeleteModal, setShowDeleteModal] = useState(false)

  // ── Change / Set password ──
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return
    setPwError('')
    setPwSuccess('')

    if (pwForm.newPw !== pwForm.confirm) {
      setPwError('New passwords do not match.')
      return
    }
    if (pwForm.newPw.length < 8) {
      setPwError('Password must be at least 8 characters.')
      return
    }

    setPwLoading(true)
    try {
      if (isGoogleUser) {
        // Google user — set a brand new password (no current password needed)
        await user.updatePassword({
          newPassword: pwForm.newPw,
          signOutOfOtherSessions: false,
        })
        setPwSuccess('Password set successfully! You can now also sign in with email & password.')
      } else {
        // Existing password user — needs to provide current password
        await user.updatePassword({
          currentPassword: pwForm.current,
          newPassword: pwForm.newPw,
          signOutOfOtherSessions: false,
        })
        setPwSuccess('Password updated successfully.')
      }
      setPwForm({ current: '', newPw: '', confirm: '' })
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Failed to update password.'
      setPwError(msg)
    } finally {
      setPwLoading(false)
    }
  }

  // ── Delete account ──
  const handleDeleteAccount = async () => {
    if (!user) return
    if (deleteConfirm !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.')
      return
    }
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await user.delete()
      await signOut()
      router.push('/')
    } catch (err: any) {
      const msg = err?.errors?.[0]?.longMessage || err?.errors?.[0]?.message || 'Failed to delete account.'
      setDeleteError(msg)
      setDeleteLoading(false)
    }
  }

  if (!isLoaded) {
    return (
      <div className="max-w-2xl">
        <h2 className="text-2xl font-bold mb-6">Account Settings</h2>
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-100 rounded-lg" />
          <div className="h-20 bg-gray-100 rounded-lg" />
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl space-y-4">
      <h2 className="text-2xl font-bold mb-6">Account Settings</h2>

      {/* ── Change / Set Password ── */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <button
          onClick={() => { setPwOpen(o => !o); setPwError(''); setPwSuccess('') }}
          className="w-full flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {isGoogleUser ? (
              <KeyRound className="w-5 h-5 text-gray-600" />
            ) : (
              <Lock className="w-5 h-5 text-gray-600" />
            )}
            <div className="text-left">
              <p className="font-semibold text-gray-900">
                {isGoogleUser ? 'Set a Password' : 'Change Password'}
              </p>
              {isGoogleUser && (
                <p className="text-xs text-gray-500 mt-0.5">
                  You signed in with Google. Set a password to also use email login.
                </p>
              )}
            </div>
          </div>
          <span className="text-gray-400 text-sm">{pwOpen ? '▲' : '▼'}</span>
        </button>

        {pwOpen && (
          <form onSubmit={handleUpdatePassword} className="px-6 pb-6 space-y-3 border-t border-gray-100">
            <div className="h-4" />

            {/* Success */}
            {pwSuccess && (
              <div className="flex items-start gap-2 bg-green-50 border border-green-200 rounded-lg p-3">
                <CheckCircle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
                <p className="text-sm text-green-800">{pwSuccess}</p>
              </div>
            )}

            {/* Error */}
            {pwError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{pwError}</p>
              </div>
            )}

            {/* Current password — only for existing password users */}
            {!isGoogleUser && (
              <div className="relative">
                <input
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="Current Password"
                  value={pwForm.current}
                  onChange={e => setPwForm({ ...pwForm, current: e.target.value })}
                  required
                  className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent(v => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            )}

            {/* New password */}
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder={isGoogleUser ? 'Create Password' : 'New Password'}
                value={pwForm.newPw}
                onChange={e => setPwForm({ ...pwForm, newPw: e.target.value })}
                required
                minLength={8}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {/* Confirm password */}
            <div className="relative">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Confirm New Password"
                value={pwForm.confirm}
                onChange={e => setPwForm({ ...pwForm, confirm: e.target.value })}
                required
                minLength={8}
                className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:border-black text-sm"
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex gap-3 pt-1">
              <button
                type="submit"
                disabled={pwLoading}
                className="bg-black text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {pwLoading
                  ? 'Saving...'
                  : isGoogleUser
                    ? 'Set Password'
                    : 'Update Password'}
              </button>
              <button
                type="button"
                onClick={() => { setPwOpen(false); setPwForm({ current: '', newPw: '', confirm: '' }); setPwError(''); setPwSuccess('') }}
                className="px-5 py-2.5 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Delete Account ── */}
      <div className="bg-white border border-red-100 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="font-semibold text-red-600 flex items-center gap-2">
              <Trash2 className="w-4 h-4" />
              Delete Account
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Permanently delete your account and all associated data. This cannot be undone.
            </p>
          </div>
          <button
            onClick={() => { setShowDeleteModal(true); setDeleteConfirm(''); setDeleteError('') }}
            className="ml-4 shrink-0 text-sm text-red-600 border border-red-200 px-4 py-2 rounded-lg hover:bg-red-50 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>

      {/* ── Logout ── */}
      <button
        onClick={() => signOut().then(() => router.push('/'))}
        className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors px-1 py-2"
      >
        <LogOut className="w-4 h-4" />
        Logout
      </button>

      {/* ── Delete Confirmation Modal ── */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="w-5 h-5 text-red-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900">Delete Account</h3>
            </div>

            <p className="text-sm text-gray-600 mb-4">
              This will permanently delete your account, order history, saved addresses, and all other data.
              <strong className="text-gray-900"> This action cannot be undone.</strong>
            </p>

            <p className="text-sm font-medium text-gray-700 mb-2">
              Type <span className="font-bold text-red-600">DELETE</span> to confirm:
            </p>
            <input
              type="text"
              value={deleteConfirm}
              onChange={e => setDeleteConfirm(e.target.value)}
              placeholder="DELETE"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:border-red-500 text-sm mb-3"
            />

            {deleteError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 rounded-lg p-3 mb-3">
                <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{deleteError}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleDeleteAccount}
                disabled={deleteLoading || deleteConfirm !== 'DELETE'}
                className="flex-1 bg-red-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {deleteLoading ? 'Deleting...' : 'Yes, Delete My Account'}
              </button>
              <button
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 border border-gray-300 py-2.5 rounded-lg text-sm hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
