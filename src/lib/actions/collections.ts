'use server'

import { CollectionService } from '@/lib/services/collections'

export async function getCollectionsAction(activeOnly = true) {
    try {
        return await CollectionService.getCollections(activeOnly)
    } catch (error: any) {
        console.error('Error in getCollectionsAction:', error)
        return { success: false, error: 'Failed to fetch collections' }
    }
}

export async function getCollectionAction(identifier: string, bySlug = false) {
    try {
        return await CollectionService.getCollection(identifier, bySlug)
    } catch (error: any) {
        console.error('Error in getCollectionAction:', error)
        return { success: false, error: 'Failed to fetch collection' }
    }
}

export async function getCollectionWithProductsAction(identifier: string, bySlug = false, limit?: number) {
    try {
        return await CollectionService.getCollectionWithProducts(identifier, bySlug, limit)
    } catch (error: any) {
        console.error('Error in getCollectionWithProductsAction:', error)
        return { success: false, error: 'Failed to fetch collection with products' }
    }
}

export async function getFeaturedCollectionsAction(limit = 6) {
    try {
        return await CollectionService.getFeaturedCollections(limit)
    } catch (error: any) {
        console.error('Error in getFeaturedCollectionsAction:', error)
        return { success: false, error: 'Failed to fetch featured collections' }
    }
}

import { prisma } from '@/lib/db'
import { StorageDeletionService } from '@/lib/services/storage-deletion'

export async function getAdminCollectionsAction(filters: any, search: string) {
    try {
        let whereClause: any = {}

        if (search) {
            whereClause.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } }
            ]
        }

        if (filters?.is_active) {
            whereClause.is_active = filters.is_active === 'true'
        }

        if (filters?.type) {
            whereClause.type = filters.type
        }

        if (filters?.created_at) {
            if (filters.created_at.from) {
                whereClause.created_at = { ...whereClause.created_at, gte: new Date(filters.created_at.from) }
            }
            if (filters.created_at.to) {
                whereClause.created_at = { ...whereClause.created_at, lte: new Date(filters.created_at.to) }
            }
        }

        const data = await prisma.collections.findMany({
            where: whereClause,
            include: {
                _count: {
                    select: { product_collections: true }
                }
            },
            orderBy: { created_at: 'desc' }
        })

        const mappedData = data.map(c => ({
            ...c,
            product_count: c._count.product_collections
        }))

        return { success: true, data: mappedData }
    } catch (error) {
        console.error('Error fetching admin collections:', error)
        return { success: false, error: 'Failed to fetch admin collections' }
    }
}

export async function toggleCollectionStatusAction(id: string, currentStatus: boolean) {
    try {
        await prisma.collections.update({
            where: { id },
            data: { is_active: !currentStatus }
        })
        return { success: true }
    } catch (error) {
        console.error('Error toggling collection status:', error)
        return { success: false, error: 'Failed to update collection status' }
    }
}

export async function deleteCollectionAction(id: string, imageUrl?: string | null) {
    try {
        if (imageUrl) {
            await StorageDeletionService.deleteCollectionImages({ image_url: imageUrl })
        }
        await prisma.collections.delete({
            where: { id }
        })
        return { success: true }
    } catch (error) {
        console.error('Error deleting collection:', error)
        return { success: false, error: 'Failed to delete collection' }
    }
}

export async function updateCollectionAction(id: string, data: {
    title: string
    description: string | null
    is_active: boolean
}) {
    try {
        const slug = data.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
        await prisma.collections.update({
            where: { id },
            data: {
                title: data.title,
                slug,
                description: data.description,
                is_active: data.is_active,
                updated_at: new Date()
            }
        })
        return { success: true }
    } catch (error) {
        console.error('Error updating collection:', error)
        return { success: false, error: 'Failed to update collection' }
    }
}

export async function manageCollectionProductsAction(collectionId: string, toAdd: string[], toRemove: string[], currentCount: number) {
    try {
        if (toRemove.length > 0) {
            await prisma.product_collections.deleteMany({
                where: {
                    collection_id: collectionId,
                    product_id: { in: toRemove }
                }
            })
        }

        if (toAdd.length > 0) {
            await prisma.product_collections.createMany({
                data: toAdd.map((productId, index) => ({
                    collection_id: collectionId,
                    product_id: productId,
                    position: currentCount + index + 1
                }))
            })
        }

        return { success: true }
    } catch (error) {
        console.error('Error managing collection products:', error)
        return { success: false, error: 'Failed to manage collection products' }
    }
}

export async function getCollectionWithProductDetailsAction(collectionId: string) {
    try {
        const collection = await prisma.collections.findUnique({
            where: { id: collectionId }
        })
        if (!collection) return { success: false, error: 'Collection not found' }

        const productCollections = await prisma.product_collections.findMany({
            where: { collection_id: collectionId },
            include: {
                products: {
                    include: {
                        product_images: true,
                        product_variants: { where: { active: true } }
                    }
                }
            },
            orderBy: { position: 'asc' }
        })

        const products = productCollections
            .filter(pc => pc.products)
            .map(pc => pc.products)

        return { success: true, data: { collection, products } }
    } catch (error) {
        console.error('Error fetching collection with product details:', error)
        return { success: false, error: 'Failed to fetch collection details' }
    }
}
