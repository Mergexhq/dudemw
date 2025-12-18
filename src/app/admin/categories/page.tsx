import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, FolderTree, Package, Eye, Edit, Trash2, ChevronRight } from "lucide-react"

const categories = [
  {
    id: 1,
    name: "Shirts",
    slug: "shirts",
    description: "Formal and casual shirts for men",
    productCount: 45,
    status: "active",
    parent: null,
    image: "/categories/shirts.jpg",
    children: [
      { id: 11, name: "Formal Shirts", productCount: 25 },
      { id: 12, name: "Casual Shirts", productCount: 20 },
    ]
  },
  {
    id: 2,
    name: "T-Shirts",
    slug: "t-shirts",
    description: "Comfortable cotton t-shirts",
    productCount: 67,
    status: "active",
    parent: null,
    image: "/categories/tshirts.jpg",
    children: [
      { id: 21, name: "Graphic Tees", productCount: 35 },
      { id: 22, name: "Plain Tees", productCount: 32 },
    ]
  },
  {
    id: 3,
    name: "Hoodies",
    slug: "hoodies",
    description: "Warm and stylish hoodies",
    productCount: 23,
    status: "active",
    parent: null,
    image: "/categories/hoodies.jpg",
    children: []
  },
  {
    id: 4,
    name: "Jeans",
    slug: "jeans",
    description: "Premium denim jeans",
    productCount: 34,
    status: "inactive",
    parent: null,
    image: "/categories/jeans.jpg",
    children: [
      { id: 41, name: "Slim Fit", productCount: 18 },
      { id: 42, name: "Regular Fit", productCount: 16 },
    ]
  },
]

export default function CategoriesPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Categories</h1>
          <p className="text-lg text-gray-600 mt-2">
            Organize your products with categories and subcategories
          </p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25">
          <Plus className="mr-2 h-4 w-4" />
          Create Category
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Categories
            </CardTitle>
            <div className="p-2 rounded-xl bg-blue-100">
              <FolderTree className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">4</div>
            <p className="text-xs text-gray-600">Main categories</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Total Products
            </CardTitle>
            <div className="p-2 rounded-xl bg-green-100">
              <Package className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">169</div>
            <p className="text-xs text-gray-600">Across all categories</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Active Categories
            </CardTitle>
            <div className="p-2 rounded-xl bg-purple-100">
              <Eye className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">3</div>
            <p className="text-xs text-gray-600">Currently visible</p>
          </CardContent>
        </Card>
      </div>

      {/* Categories List */}
      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">All Categories</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {categories.map((category) => (
              <div key={category.id} className="space-y-2">
                <div className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-200/50 hover:shadow-md transition-all duration-200">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                      <FolderTree className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{category.name}</h3>
                      <p className="text-sm text-gray-600">{category.description}</p>
                      <p className="text-xs text-gray-500">/{category.slug}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <p className="text-sm font-medium text-gray-900">{category.productCount}</p>
                      <p className="text-xs text-gray-500">Products</p>
                    </div>

                    <Badge 
                      variant={category.status === "active" ? "default" : "secondary"}
                      className={category.status === "active" 
                        ? "bg-green-100 text-green-700 border-green-200" 
                        : "bg-gray-100 text-gray-700 border-gray-200"
                      }
                    >
                      {category.status}
                    </Badge>

                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-red-100 text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Subcategories */}
                {category.children.length > 0 && (
                  <div className="ml-8 space-y-2">
                    {category.children.map((child) => (
                      <div key={child.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50/60 border border-gray-100">
                        <div className="flex items-center space-x-3">
                          <ChevronRight className="h-4 w-4 text-gray-400" />
                          <div>
                            <h4 className="font-medium text-gray-800">{child.name}</h4>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <span className="text-sm text-gray-600">{child.productCount} products</span>
                          <div className="flex items-center space-x-1">
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-gray-100">
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 hover:bg-red-100 text-red-600">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}