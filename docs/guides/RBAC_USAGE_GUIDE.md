# Admin RBAC System - Usage Guide

## Table of Contents
1. [Permission Checks](#permission-checks)
2. [Activity Logging](#activity-logging)
3. [Invite Management](#invite-management)
4. [UI Components](#ui-components)
5. [Common Patterns](#common-patterns)

---

## Permission Checks

### Server-Side (API Routes)

```typescript
import { hasPermission } from '@/lib/services/permissions'
import { getCurrentAdmin } from '@/lib/admin-auth'

export async function POST(request: NextRequest) {
  const admin = await getCurrentAdmin()
  
  if (!admin || !admin.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Check single permission
  const canCreate = await hasPermission(admin.user.id, 'product.create')
  if (!canCreate) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Your logic here
}
```

### Client-Side (Components)

```typescript
import { usePermission, useUserPermissions } from '@/lib/hooks/usePermission'

function MyComponent() {
  // Single permission check
  const { hasPermission, isLoading } = usePermission('product.create')
  
  // Multiple permissions
  const { hasAnyPermission, hasAllPermissions } = useUserPermissions()
  
  if (isLoading) return <Loader />
  
  return (
    <>
      {hasPermission && <Button>Create Product</Button>}
      
      {hasAnyPermission(['product.edit', 'product.delete']) && (
        <Button>Edit/Delete</Button>
      )}
    </>
  )
}
```

### Using PermissionGuard Component

```typescript
import { PermissionGuard } from '@/components/admin/PermissionGuard'

function ProductActions() {
  return (
    <>
      {/* Single permission */}
      <PermissionGuard permission="product.create">
        <Button>Create Product</Button>
      </PermissionGuard>

      {/* Multiple permissions (ANY) */}
      <PermissionGuard permissions={['product.edit', 'product.delete']}>
        <Button>Edit/Delete</Button>
      </PermissionGuard>

      {/* Multiple permissions (ALL) */}
      <PermissionGuard 
        permissions={['product.edit', 'product.publish']} 
        requireAll
      >
        <Button>Edit & Publish</Button>
      </PermissionGuard>

      {/* With fallback */}
      <PermissionGuard 
        permission="product.create"
        fallback={<p>You don't have permission to create products</p>}
      >
        <Button>Create Product</Button>
      </PermissionGuard>
    </>
  )
}
```

---

## Activity Logging

### Log Admin Actions

```typescript
import { logActivity } from '@/lib/services/activity-logger'

// In API route or server action
await logActivity({
  adminUserId: admin.user.id,
  action: 'product.create',
  entityType: 'product',
  entityId: product.id,
  metadata: {
    name: product.name,
    sku: product.sku,
    price: product.price
  },
  ipAddress: request.headers.get('x-forwarded-for') || request.ip,
  userAgent: request.headers.get('user-agent') || undefined
})
```

### Common Actions to Log

```typescript
// User management
await logActivity({
  adminUserId: userId,
  action: 'user.invite',
  entityType: 'admin_invite',
  entityId: inviteId,
  metadata: { email, role }
})

// Product operations
await logActivity({
  adminUserId: userId,
  action: 'product.delete',
  entityType: 'product',
  entityId: productId,
  metadata: { name: productName }
})

// Order updates
await logActivity({
  adminUserId: userId,
  action: 'order.update_status',
  entityType: 'order',
  entityId: orderId,
  metadata: { oldStatus, newStatus }
})

// Settings changes
await logActivity({
  adminUserId: userId,
  action: 'settings.edit',
  entityType: 'system_preferences',
  metadata: { changes: { low_stock_alert: true } }
})
```

### View Activity Logs

```typescript
import { ActivityLogsViewer } from '@/components/admin/ActivityLogsViewer'

function AdminDashboard() {
  return (
    <div>
      <h1>Admin Dashboard</h1>
      <ActivityLogsViewer />
    </div>
  )
}
```

---

## Invite Management

### Create Invite (Server-Side)

```typescript
import { createInvite } from '@/lib/services/admin-invites'

const result = await createInvite({
  email: 'manager@example.com',
  role: 'manager',
  invitedBy: currentUserId,
  expiryHours: 72 // Optional, defaults to 72
})

if (result.success) {
  console.log('Invite created:', result.inviteId)
  console.log('Token (show once):', result.token)
}
```

### Create Invite (Client-Side)

```typescript
async function handleInvite(email: string, role: string) {
  const response = await fetch('/api/admin/invites', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, role })
  })

  const data = await response.json()
  
  if (data.success) {
    toast.success('Invite sent!')
  }
}
```

### Resend Invite

```typescript
async function resendInvite(inviteId: string) {
  const response = await fetch(`/api/admin/invites/${inviteId}/resend`, {
    method: 'POST'
  })

  const data = await response.json()
  
  if (data.success) {
    toast.success('Invite resent!')
  }
}
```

### Revoke Invite

```typescript
async function revokeInvite(inviteId: string) {
  const response = await fetch(`/api/admin/invites/${inviteId}/revoke`, {
    method: 'POST'
  })

  const data = await response.json()
  
  if (data.success) {
    toast.success('Invite revoked!')
  }
}
```

---

## UI Components

### Admin Users Settings

The refactored admin users page includes:
- Invite modal
- Pending invites section
- Resend/revoke actions
- Admin users list with last login

```typescript
import { AdminUsersSettings } from '@/domains/admin/settings/admin-users-settings'

function SettingsPage() {
  return <AdminUsersSettings />
}
```

### Activity Logs Viewer

```typescript
import { ActivityLogsViewer } from '@/components/admin/ActivityLogsViewer'

function LogsPage() {
  return (
    <div className="p-6">
      <h1>Activity Logs</h1>
      <ActivityLogsViewer />
    </div>
  )
}
```

---

## Common Patterns

### Protect API Route

```typescript
import { hasPermission } from '@/lib/services/permissions'
import { getCurrentAdmin } from '@/lib/admin-auth'
import { logActivity } from '@/lib/services/activity-logger'

export async function POST(request: NextRequest) {
  // 1. Authenticate
  const admin = await getCurrentAdmin()
  if (!admin || !admin.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Check permission
  const canCreate = await hasPermission(admin.user.id, 'product.create')
  if (!canCreate) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // 3. Perform action
  const body = await request.json()
  const product = await createProduct(body)

  // 4. Log activity
  await logActivity({
    adminUserId: admin.user.id,
    action: 'product.create',
    entityType: 'product',
    entityId: product.id,
    metadata: { name: product.name },
    ipAddress: request.headers.get('x-forwarded-for') || request.ip,
    userAgent: request.headers.get('user-agent') || undefined
  })

  return NextResponse.json({ success: true, product })
}
```

### Conditional UI Rendering

```typescript
import { PermissionGuard } from '@/components/admin/PermissionGuard'
import { useUserPermissions } from '@/lib/hooks/usePermission'

function ProductPage() {
  const { hasPermission } = useUserPermissions()

  return (
    <div>
      <h1>Products</h1>

      {/* Show create button only if has permission */}
      <PermissionGuard permission="product.create">
        <Button onClick={handleCreate}>Create Product</Button>
      </PermissionGuard>

      {/* Disable button if no permission */}
      <Button disabled={!hasPermission('product.delete')}>
        Delete
      </Button>

      {/* Show different UI based on permissions */}
      {hasPermission('product.edit') ? (
        <EditForm />
      ) : (
        <ViewOnlyForm />
      )}
    </div>
  )
}
```

### Role-Based Dashboard

```typescript
import { useUserPermissions } from '@/lib/hooks/usePermission'

function AdminDashboard() {
  const { permissions, hasPermission } = useUserPermissions()

  // Super admin sees everything
  const isSuperAdmin = permissions.includes('*')

  return (
    <div className="grid grid-cols-3 gap-4">
      {/* Everyone sees orders */}
      {hasPermission('order.view') && <OrdersWidget />}

      {/* Only managers and above see analytics */}
      {hasPermission('analytics.view') && <AnalyticsWidget />}

      {/* Only super admins see user management */}
      {isSuperAdmin && <UserManagementWidget />}
    </div>
  )
}
```

---

## Permission Reference

### Product Permissions
- `product.view` - View products
- `product.create` - Create new products
- `product.edit` - Edit existing products
- `product.delete` - Delete products
- `product.publish` - Publish products

### Order Permissions
- `order.view` - View orders
- `order.create` - Create orders
- `order.update_status` - Update order status
- `order.cancel` - Cancel orders
- `order.refund` - Process refunds

### User Management Permissions
- `user.view` - View admin users
- `user.manage` - Manage admin users
- `user.invite` - Invite admin users

### Settings Permissions
- `settings.view` - View settings
- `settings.edit` - Edit settings
- `settings.system` - Manage system settings

[See full permission list in database]

---

## Best Practices

1. **Always check permissions server-side** - Client-side checks are for UX only
2. **Log important actions** - Especially user management, deletions, and status changes
3. **Use PermissionGuard for UI** - Cleaner than conditional rendering
4. **Batch permission checks** - Use `useUserPermissions` instead of multiple `usePermission` calls
5. **Include metadata in logs** - Makes debugging and auditing easier
6. **Handle loading states** - Permission checks are async
7. **Provide fallback UI** - Show helpful messages when permissions are missing

---

## Troubleshooting

### Permission check always returns false

- Verify user is logged in
- Check admin_profiles table for user entry
- Verify role_permissions mapping exists
- Check RLS policies on permissions tables

### Invite email not sending

- Verify `RESEND_API_KEY` is set
- Check Resend dashboard for errors
- Verify `NEXT_PUBLIC_APP_URL` is correct

### Activity logs not appearing

- Check service role key is configured
- Verify RLS policies allow insert
- Check browser console for errors

---

## Environment Variables

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
RESEND_API_KEY=re_your_resend_key

# Optional
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```
