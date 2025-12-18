import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Plus, Layers, Package, Eye, EyeOff, Edit, Trash2, Calendar } from "lucide-react"

const collections = [
  {
    id: 1,
    name: "Winter Sale 2024",
    description: "Warm clothing for the winter season",
    type: "manual",
    productCount: 23,
    status: "active",
    featured: true,
    startDate: "2024-01-01",
    endDate: "2024-02-29",
    image: "/collections/winter-sale.jpg",
  },
  {
    id: 2,
    name: "New Arrivals",
    description: "Latest products added to our store",
    type: "automatic",
    productCount: 15,
    status: "active",
    featured: false,
    startDate: "2024-01-15",
    endDate: null,
    image: "/collections/new-arrivals.jpg",
  },
]

export default function CollectionsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Collections</h1>
          <p className="text-lg text-gray-600 mt-2">
            Create curated product collections for campaigns and merchandising
          </p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25">
          <Plus className="mr-2 h-4 w-4" />
          Create Collection
        </Button>
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
            <div className="text-3xl font-bold text-gray-900 mb-2">2</div>
            <p className="text-xs text-gray-600">Active collections</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-sm bg-gradient-to-b from-white to-red-50 border-red-100/50 hover:shadow-md transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-semibold text-gray-700">
              Featured Collections
            </CardTitle>
            <div className="p-2 rounded-xl bg-green-100">
              <Eye className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="text-3xl font-bold text-gray-900 mb-2">1</div>
            <p className="text-xs text-gray-600">On homepage</p>
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
            <div className="text-3xl font-bold text-gray-900 mb-2">38</div>
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
          <div className="space-y-4">
            {collections.map((collection) => (
              <div
                key={collection.id}
                className="flex items-center justify-between p-4 rounded-xl bg-white/60 border border-gray-200/50 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-12 bg-gray-200 rounded-lg flex items-center justify-center">
                    <Layers className="h-6 w-6 text-gray-400" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-900">{collection.name}</h3>
                      {collection.featured && (
                        <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200">
                          Featured
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">{collection.description}</p>
                    <div className="flex items-center space-x-4 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {collection.type}
                      </Badge>
                      {collection.endDate && (
                        <div className="flex items-center space-x-1 text-xs text-gray-500">
                          <Calendar className="h-3 w-3" />
                          <span>Ends {collection.endDate}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-900">{collection.productCount}</p>
                    <p className="text-xs text-gray-500">Products</p>
                  </div>
                  <Badge
                    variant={collection.status === "active" ? "default" : "secondary"}
                    className={collection.status === "active"
                      ? "bg-green-100 text-green-700 border-green-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                    }
                  >
                    {collection.status}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-gray-100">
                      {collection.status === "active" ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 hover:bg-red-100 text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}