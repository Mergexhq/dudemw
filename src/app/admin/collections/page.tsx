'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Layers, Package, Eye, EyeOff, Edit, Trash2, Calendar, RefreshCw } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface Collection {
  id: string
  title: string
  slug: string
  description: string | null
  type: string
  is_active: boolean
  rule_json: any
  created_at: string
  updated_at: string
  product_count?: number
}

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const supabase = createClient()

  const fetchCollections = async () => {
    try {
      setIsLoading(true)
      
      // Fetch collections
      const { data: collectionsData, error: collectionsError } = await supabase
        .from('collections')
        .select('*')
        .order('created_at', { ascending: false })

      if (collectionsError) throw collectionsError

      // Fetch product counts for each collection
      const collectionsWithCounts = await Promise.all(
        (collectionsData || []).map(async (collection) => {
          const { count, error: countError } = await supabase
            .from('product_collections')
            .select('*', { count: 'exact', head: true })
            .eq('collection_id', collection.id)

          if (countError) {
            console.error('Error fetching product count:', countError)
            return { ...collection, product_count: 0 }
          }

          return { ...collection, product_count: count || 0 }
        })
      )

      setCollections(collectionsWithCounts)
    } catch (error) {
      console.error('Error fetching collections:', error)
      toast.error('Failed to load collections')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchCollections()
  }, [])

  const activeCollections = collections.filter(c => c.is_active)
  const totalProducts = collections.reduce((sum, c) => sum + (c.product_count || 0), 0)

  const handleToggleActive = async (collection: Collection) => {
    try {
      const { error } = await supabase
        .from('collections')
        .update({ is_active: !collection.is_active })
        .eq('id', collection.id)

      if (error) throw error
      toast.success(`Collection ${!collection.is_active ? 'activated' : 'deactivated'}`)
      fetchCollections()
    } catch (error) {
      console.error('Error toggling collection:', error)
      toast.error('Failed to update collection')
    }
  }

  const handleDelete = async (collectionId: string) => {
    if (!confirm('Are you sure you want to delete this collection? This will not delete the products.')) return

    try {
      const { error } = await supabase
        .from('collections')
        .delete()
        .eq('id', collectionId)

      if (error) throw error
      toast.success('Collection deleted successfully')
      fetchCollections()
    } catch (error) {
      console.error('Error deleting collection:', error)
      toast.error('Failed to delete collection')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-center p-12">
          <RefreshCw className="h-8 w-8 animate-spin text-red-600" />
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8" data-testid="collections-page">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Collections</h1>
          <p className="text-lg text-gray-600 mt-2">
            Create curated product collections for campaigns and merchandising
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            onClick={fetchCollections}
            disabled={isLoading}
            data-testid="refresh-collections-button"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25" data-testid="create-collection-button">
            <Plus className="mr-2 h-4 w-4" />
            Create Collection
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Collections
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-100">
              <Layers className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2" data-testid="total-collections-count">{collections.length}</div>
            <p className="text-xs text-gray-600">All collections</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Active Collections
            </CardTitle>
            <div className="p-2 rounded-xl bg-green-100">
              <Eye className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2" data-testid="active-collections-count">{activeCollections.length}</div>
            <p className="text-xs text-gray-600">Currently active</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Products
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-100">
              <Package className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2" data-testid="total-products-count">{totalProducts}</div>
            <p className="text-xs text-gray-600">In collections</p>
          </CardContent>
        </Card>
      </div>

      {/* Collections List */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">All Collections</CardTitle>
        </CardHeader>
        <CardContent>
          {collections.length === 0 ? (
            <div className="text-center py-12">
              <Layers className="h-12 w-12 mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No collections yet</h3>
              <p className="text-gray-600 mb-4">Create your first collection to organize your products</p>
              <Button className="bg-red-600 hover:bg-red-700 text-white">
                <Plus className="mr-2 h-4 w-4" />
                Create Collection
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {collections.map((collection) => (
                <div
                  key={collection.id}
                  className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-200/50 hover:shadow-md transition-all duration-200"
                  data-testid={`collection-item-${collection.slug}`}
                >
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <Layers className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <h3 className="font-semibold text-gray-900">{collection.title}</h3>
                      </div>
                      {collection.description && (
                        <p className="text-sm text-gray-600">{collection.description}</p>
                      )}
                      <div className="flex items-center space-x-4 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {collection.type}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {collection.product_count || 0} products
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{collection.product_count || 0}</p>
                      <p className="text-xs text-gray-500">Products</p>
                    </div>
                    <Badge
                      variant={collection.is_active ? "default" : "secondary"}
                      className={collection.is_active
                        ? "bg-green-100 text-green-700 border-green-200"
                        : "bg-gray-100 text-gray-700 border-gray-200"
                      }
                      data-testid={`collection-status-${collection.slug}`}
                    >
                      {collection.is_active ? 'active' : 'inactive'}
                    </Badge>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100" data-testid={`edit-collection-${collection.slug}`}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-gray-100"
                        onClick={() => handleToggleActive(collection)}
                        data-testid={`toggle-collection-${collection.slug}`}
                      >
                        {collection.is_active ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-red-100 text-red-600"
                        onClick={() => handleDelete(collection.id)}
                        data-testid={`delete-collection-${collection.slug}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
