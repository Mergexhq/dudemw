# Quick Fix Script - Clear Cache and Restart

## The Issue
You're seeing "Rendered more hooks than during the previous render" error on first load that goes away on refresh. This is because Next.js is caching the old version of the component.

## Solution: Clear Cache and Restart

### Step 1: Stop Your Development Server
Press `Ctrl+C` in your terminal to stop the Next.js server.

### Step 2: Clear Next.js Cache
Run these commands in your project directory:

```bash
# Windows (PowerShell)
Remove-Item -Recurse -Force .next

# Or Windows (Command Prompt)
rmdir /s /q .next

# Linux/Mac
rm -rf .next
```

### Step 3: Clear npm/node cache (optional but recommended)
```bash
npm cache clean --force
```

### Step 4: Restart Development Server
```bash
npm run dev
```

### Step 5: Hard Refresh Browser
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) or `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) or `Cmd + Shift + R` (Mac)
- Or open DevTools (F12) → Right-click refresh button → "Empty Cache and Hard Reload"

## What Changed in the Latest Fix

I've further optimized the `/src/app/admin/layout.tsx` file to ensure:

1. ✅ All hooks (`useState`, `useEffect`) are called at the **very top** of the component
2. ✅ No variables between hooks
3. ✅ All conditional logic happens **after** all hooks
4. ✅ Simplified the conditional rendering logic

## Expected Result

After clearing cache and restarting:
- ✅ Settings page loads without errors on first visit
- ✅ No "Rendered more hooks" error in console
- ✅ Navigation between pages works smoothly
- ✅ No errors on page refresh

## If Error Still Persists

Try these additional steps:

### 1. Clear Browser Cache Completely
- Chrome: Settings → Privacy → Clear browsing data → Clear cache
- Or use Incognito/Private mode to test

### 2. Check for Multiple Instances
Make sure you don't have multiple Next.js dev servers running:

```bash
# Windows
tasklist | findstr node

# Linux/Mac
ps aux | grep node
```

Kill any old processes if found.

### 3. Verify File Changes
Check that the file was updated correctly:

```bash
# View the admin layout file
cat src/app/admin/layout.tsx | grep "useState\|useEffect" -A 2
```

You should see all useState calls together at the top:
```typescript
const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
const [isCheckingAuth, setIsCheckingAuth] = useState(true)
```

### 4. Try Turbopack Restart
If using Turbopack (Next.js 16), try:

```bash
npm run dev -- --turbo
```

## Still Having Issues?

If the error persists after all these steps, please share:
1. The exact URL where the error occurs
2. Whether it happens on ALL admin pages or just settings
3. Console logs showing the full error stack
4. Whether you're on Windows/Mac/Linux

I'll help debug further!
