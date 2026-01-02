# Scheduled Banner Display Fix

## Problem
Banners with status "scheduled" were not appearing in the admin panel's Banners page when filtered by status, even though:
- They existed in the database with status='scheduled'
- The stats card showed "1 Scheduled" banner
- The filter was set to "Scheduled"

## Root Cause
The issue was in the `BannerService.getBanners()` function in `/app/src/lib/services/banners.ts`:

1. **Status filtering happened at the wrong time**: The function was filtering banners by status at the database query level BEFORE recalculating status based on dates
2. **Mismatch in status calculation**: The `getBannerStats()` function counted banners by their stored database status, while `getBanners()` returned banners with dynamically recalculated status based on `start_date` and `end_date`

### Example of the Bug:
1. A banner is stored in the database with `status='scheduled'` and `start_date='2025-01-15'`
2. When filtering by status='scheduled', the query retrieves this banner
3. The code then recalculates the status: if the current date is past 2025-01-15, the status becomes 'active'
4. The status filter no longer matches, but the banner was already filtered at database level
5. This created an inconsistent state where stats showed scheduled banners but the filter couldn't find them

## Solution
Modified two functions in `/app/src/lib/services/banners.ts`:

### 1. `getBanners()` - Apply status filter AFTER recalculation
**Before:**
```javascript
// Applied status filter at database query level
if (filters?.status && filters.status !== 'all') {
  query = query.eq('status', filters.status)
}
// Then recalculated status after query
```

**After:**
```javascript
// Removed status filter from database query
// Only apply placement and category filters at database level

// After recalculating status based on dates:
let finalData = bannersWithStatus
if (filters?.status && filters.status !== 'all') {
  finalData = bannersWithStatus.filter((banner: Banner) => banner.status === filters.status)
}
```

### 2. `getBannerStats()` - Use same status calculation logic
**Before:**
```javascript
// Counted banners by their stored database status
switch (banner.status) {
  case 'scheduled':
    stats.scheduled++
    break
  // ...
}
```

**After:**
```javascript
// Recalculate status based on dates first (same logic as getBanners)
let status = banner.status
const startDate = banner.start_date ? new Date(banner.start_date) : null
const endDate = banner.end_date ? new Date(banner.end_date) : null

if (status !== 'disabled') {
  if (startDate && startDate > now) {
    status = 'scheduled'
  } else if (endDate && endDate < now) {
    status = 'expired'
  } else if (startDate && startDate <= now && (!endDate || endDate >= now)) {
    status = 'active'
  }
}

// Then count by recalculated status
switch (status) {
  case 'scheduled':
    stats.scheduled++
    break
  // ...
}
```

## Benefits
1. **Consistency**: Both stats and filtered results now use the same logic for determining banner status
2. **Accurate filtering**: Scheduled banners are now correctly displayed when filtered by status="scheduled"
3. **Dynamic status**: Banner status automatically updates based on their start and end dates without manual database updates

## Testing
To verify the fix:
1. Navigate to the admin panel Banners page
2. Check the "Scheduled" stats card - should show count of banners with future start_date
3. Select "Scheduled" from the Status filter dropdown
4. Verify that scheduled banners now appear in the list
5. Verify the banner status badge shows "scheduled" and dates are in the future

## Files Modified
- `/app/src/lib/services/banners.ts`
  - `getBanners()` method (lines 22-99)
  - `getBannerStats()` method (lines 270-327)
