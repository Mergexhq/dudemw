import { MetadataRoute } from 'next'
import prisma from '@/lib/db'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://dudemw.com'

  // Static pages
  const staticPages = [
    '',
    '/about',
    '/contact',
    '/faq',
    '/shipping-policy',
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

  try {
    // Fetch products from Prisma
    const products = await prisma.products.findMany({
      where: { status: 'active' },
      select: { slug: true, updated_at: true },
      orderBy: { created_at: 'desc' },
    })

    const productPages = products.map((product) => ({
      url: `${baseUrl}/products/${product.slug}`,
      lastModified: product.updated_at ? new Date(product.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Fetch categories from Prisma
    const categories = await prisma.categories.findMany({
      select: { slug: true, updated_at: true },
    })

    const categoryPages = categories.map((category) => ({
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
  } catch (error) {
    console.error('Error generating sitemap data:', error)
    // Fallback to just static pages if DB fails
    return [
      ...staticPages,
      {
        url: `${baseUrl}/products`,
        lastModified: new Date(),
        changeFrequency: 'daily' as const,
        priority: 0.9,
      }
    ]
  }
}
