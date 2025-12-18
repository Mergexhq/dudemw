import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { Plus, MapPin, Edit, Trash2 } from "lucide-react"

const locations = [
  {
    id: 1,
    name: "Main Warehouse",
    address: "123 Industrial Area, Mumbai, Maharashtra 400001",
    type: "warehouse",
    isPrimary: true,
  },
  {
    id: 2,
    name: "Delhi Distribution Center",
    address: "456 Logistics Hub, New Delhi, Delhi 110001",
    type: "distribution",
    isPrimary: false,
  },
]

export default function StoreLocationsPage() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Store Locations</h1>
          <p className="text-lg text-gray-600 mt-2">
            Manage warehouse and fulfillment locations
          </p>
        </div>
        <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25">
          <Plus className="mr-2 h-4 w-4" />
          Add Location
        </Button>
      </div>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Fulfillment Locations</CardTitle>
          <CardDescription className="text-gray-600">
            Configure where your orders are fulfilled from
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Location</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {locations.map((location) => (
                <TableRow key={location.id}>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      <span className="font-medium">{location.name}</span>
                      {location.isPrimary && (
                        <Badge variant="default">Primary</Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {location.address}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {location.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-green-600 border-green-600">
                      Active
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      {!location.isPrimary && (
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader>
          <CardTitle className="text-xl font-bold text-gray-900">Add New Location</CardTitle>
          <CardDescription className="text-gray-600">
            Add a new warehouse or distribution center
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input id="locationName" placeholder="e.g., Main Warehouse" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationType">Type</Label>
              <Input id="locationType" placeholder="e.g., Warehouse, Distribution Center" />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="locationAddress">Full Address</Label>
            <Input id="locationAddress" placeholder="Enter complete address with pincode" />
          </div>
          <div className="flex justify-end">
            <Button className="bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-600/25">
              <Plus className="mr-2 h-4 w-4" />
              Add Location
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}