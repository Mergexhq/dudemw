import { AdminUsersSettings } from "@/domains/admin/settings/admin-users-settings"

export default function AdminUsersPage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold tracking-tight text-gray-900">Admin Users</h1>
        <p className="text-lg text-gray-600 mt-2">
          Manage admin access and permissions
        </p>
      </div>
      <AdminUsersSettings />
    </div>
  )
}