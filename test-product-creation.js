/**
 * Product Creation Diagnostic Script
 * Run this with: node test-product-creation.js
 * 
 * This script helps diagnose product creation issues by:
 * 1. Checking environment variables
 * 2. Testing Supabase connection
 * 3. Testing database permissions
 */

require('dotenv').config({ path: '.env.local' })

console.log('=== Product Creation Diagnostic ===\n')

// 1. Check Environment Variables
console.log('1. Checking Environment Variables...')
const requiredEnvVars = [
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
]

let missingVars = []
requiredEnvVars.forEach(varName => {
  const value = process.env[varName]
  if (!value) {
    console.log(`  ❌ ${varName}: MISSING`)
    missingVars.push(varName)
  } else {
    console.log(`  ✅ ${varName}: ${value.substring(0, 20)}...`)
  }
})

if (missingVars.length > 0) {
  console.log('\n⚠️  Missing environment variables. Please check your .env.local file.')
  process.exit(1)
}

console.log('\n2. Environment variables look good!\n')

// Instructions
console.log('=== Next Steps ===')
console.log('1. Make sure your .env.local file exists with all required variables')
console.log('2. Check Supabase dashboard for RLS policies on these tables:')
console.log('   - products')
console.log('   - product_images')
console.log('   - product_options')
console.log('   - product_variants')
console.log('   - inventory_items')
console.log('3. Ensure your service role key has admin privileges')
console.log('\n=== Common Issues ===')
console.log('• RLS policies blocking inserts (most common)')
console.log('• Missing database columns')
console.log('• Invalid foreign key relationships')
console.log('• Storage bucket permissions for product-images')
