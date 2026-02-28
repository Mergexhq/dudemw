import { prisma } from '@/lib/db'
import {
  Supplier,
  SupplierProduct,
  CreateSupplierInput,
  UpdateSupplierInput,
  SupplierFilters,
} from '@/lib/types/supplier'

export class SupplierService {
  /** Get all suppliers with optional filtering */
  static async getSuppliers(filters?: SupplierFilters) {
    try {
      const where: any = {}
      if (filters?.is_active !== undefined) where.is_active = filters.is_active
      if (filters?.search) {
        where.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { contact_person: { contains: filters.search, mode: 'insensitive' } },
          { email: { contains: filters.search, mode: 'insensitive' } },
        ]
      }

      const data = await prisma.suppliers.findMany({
        where,
        orderBy: { name: 'asc' },
      })
      return { success: true, data: data as unknown as Supplier[] }
    } catch (error) {
      console.error('Error fetching suppliers:', error)
      return { success: false, error: 'Failed to fetch suppliers' }
    }
  }

  /** Get a single supplier by ID */
  static async getSupplier(id: string) {
    try {
      const data = await prisma.suppliers.findUnique({ where: { id } })
      if (!data) return { success: false, error: 'Supplier not found' }
      return { success: true, data: data as unknown as Supplier }
    } catch (error) {
      console.error('Error fetching supplier:', error)
      return { success: false, error: 'Failed to fetch supplier' }
    }
  }

  /** Create a new supplier */
  static async createSupplier(input: CreateSupplierInput) {
    try {
      const data = await prisma.suppliers.create({
        data: { ...input } as any,
      })
      return { success: true, data: data as unknown as Supplier }
    } catch (error) {
      console.error('Error creating supplier:', error)
      return { success: false, error: 'Failed to create supplier' }
    }
  }

  /** Update an existing supplier */
  static async updateSupplier(id: string, input: UpdateSupplierInput) {
    try {
      const data = await prisma.suppliers.update({
        where: { id },
        data: { ...input, updated_at: new Date() } as any,
      })
      return { success: true, data: data as unknown as Supplier }
    } catch (error) {
      console.error('Error updating supplier:', error)
      return { success: false, error: 'Failed to update supplier' }
    }
  }

  /** Delete a supplier */
  static async deleteSupplier(id: string) {
    try {
      await prisma.suppliers.delete({ where: { id } })
      return { success: true }
    } catch (error) {
      console.error('Error deleting supplier:', error)
      return { success: false, error: 'Failed to delete supplier' }
    }
  }

  /** Link a product to a supplier */
  static async linkProductToSupplier(
    supplierProduct: Omit<SupplierProduct, 'id' | 'created_at' | 'updated_at'>
  ) {
    try {
      const data = await prisma.supplier_products.create({
        data: { ...supplierProduct } as any,
      })
      return { success: true, data: data as unknown as SupplierProduct }
    } catch (error) {
      console.error('Error linking product to supplier:', error)
      return { success: false, error: 'Failed to link product to supplier' }
    }
  }

  /** Get all products for a supplier */
  static async getSupplierProducts(supplierId: string) {
    try {
      const data = await prisma.supplier_products.findMany({
        where: { supplier_id: supplierId } as any,
        include: {
          products: { select: { id: true, title: true } },
          product_variants: { select: { id: true, name: true, sku: true } },
        },
      })
      return { success: true, data }
    } catch (error) {
      console.error('Error fetching supplier products:', error)
      return { success: false, error: 'Failed to fetch supplier products' }
    }
  }
}
