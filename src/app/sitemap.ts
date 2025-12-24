import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/client'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createClient()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dudemenswear.com'

  // Static pages
  const staticPages = [
    '',
    '/about',
    '/contact',
    '/faq',
    '/shipping',
    '/returns',
    '/refund-policy',
    '/terms',
    '/privacy',
    '/size-guide',
    '/stores',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: route === '' ? 1 : 0.8,
  }))

  // Fetch products from Supabase
  const { data: products } = await supabase
    .from('products')
    .select('slug, updated_at')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  const productPages = (products || []).map((product) => ({
    url: `${baseUrl}/products/${product.slug}`,
    lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }))

  // Fetch categories
  const { data: categories } = await supabase
    .from('categories')
    .select('slug, updated_at')

  const categoryPages = (categories || []).map((category) => ({
    url: `${baseUrl}/categories/${category.slug}`,
    lastModified: category.updated_at ? new Date(category.updated_at) : new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }))



  return [
    ...staticPages,
    {
      url: `${baseUrl}/products`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    ...productPages,
    ...categoryPages,

  ]
}
