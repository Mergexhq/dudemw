"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    FileSpreadsheet,
    Download,
    BookOpen,
    HelpCircle,
    ExternalLink,
    Package,
    Truck,
    Receipt,
    Tag,
    Mail,
    X
} from "lucide-react"

interface Guide {
    id: string
    title: string
    description: string
    icon: any
    content: string[]
}

export default function HelpCenterPage() {
    const [selectedGuide, setSelectedGuide] = useState<Guide | null>(null)

    const csvTemplates = [
        {
            title: "Product Import Template",
            description: "Import products with images, prices, and variants",
            filename: "products_import_template.csv",
            icon: Package,
        },
        {
            title: "Inventory Update Template",
            description: "Bulk update stock quantities for existing products",
            filename: "inventory_update_template.csv",
            icon: FileSpreadsheet,
        },
    ]

    const guides: Guide[] = [
        {
            id: "tax",
            title: "Tax Setup Guide",
            description: "Configure GST rates and state-wise tax rules for India",
            icon: Receipt,
            content: [
                "Go to Settings → Commerce → Taxes",
                "Set your store's GSTIN number",
                "Configure default GST rate (usually 5%, 12%, 18%, or 28%)",
                "For intra-state sales (within same state): CGST + SGST applies",
                "For inter-state sales (different states): IGST applies",
                "Enable 'Prices include GST' if your product prices already include tax",
                "Save changes and verify with a test order"
            ]
        },
        {
            id: "shipping",
            title: "Shipping Rules",
            description: "Set up shipping zones and condition-based pricing",
            icon: Truck,
            content: [
                "Go to Settings → Commerce → Shipping",
                "Click 'Add Rule' to create a new shipping rule",
                "Select the zone (Tamil Nadu, South India, North India, etc.)",
                "Set quantity range (e.g., 1-4 items, 5+ items)",
                "Enter the shipping rate in ₹",
                "Toggle 'Enable Free Shipping' for orders above a threshold",
                "Example: Tamil Nadu 1-4 items = ₹60, 5+ items = ₹120"
            ]
        },
        {
            id: "sku",
            title: "SKU Format Rules",
            description: "Best practices for creating consistent SKU identifiers",
            icon: Tag,
            content: [
                "Use a consistent format: CATEGORY-BRAND-STYLE-SIZE-COLOR",
                "Example: SHIRT-DMW-OXFORD-M-BLU",
                "Keep SKUs short but descriptive (max 20 characters)",
                "Use uppercase letters only",
                "Avoid special characters except hyphens (-)",
                "Include size and color codes for variants",
                "Never reuse SKUs - each variant must have a unique SKU"
            ]
        },
    ]

    const handleDownloadTemplate = (filename: string) => {
        let csvContent = ""

        if (filename === "products_import_template.csv") {
            // Product import template
            csvContent = [
                "name,description,category,sku,price,compare_at_price,status,manage_inventory,stock_quantity,allow_backorders,is_taxable,is_discountable",
                "Sample Shirt,A comfortable cotton shirt,Shirts,SHIRT-001,999,1299,active,true,50,false,true,true",
                "Sample Pants,Premium denim jeans,Pants,PANT-001,1499,1999,active,true,30,false,true,true"
            ].join("\n")
        } else if (filename === "inventory_update_template.csv") {
            // Inventory update template
            csvContent = [
                "sku,stock_quantity,allow_backorders",
                "SHIRT-001,50,false",
                "PANT-001,30,false",
                "SHOE-001,25,false"
            ].join("\n")
        }

        // Create blob and download
        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
        const link = document.createElement("a")
        const url = URL.createObjectURL(blob)
        link.setAttribute("href", url)
        link.setAttribute("download", filename)
        link.style.visibility = "hidden"
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(url)
    }

    const handleContactSupport = () => {
        window.location.href = "mailto:support@mergex.in?subject=Support Request - Dude Menswear Admin"
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">Help Center</h1>
                <p className="text-gray-600 mt-2">
                    Resources, templates, and guides to help you manage your store
                </p>
            </div>

            {/* CSV Templates */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <FileSpreadsheet className="w-5 h-5 mr-2 text-red-600" />
                        CSV Templates
                    </CardTitle>
                    <CardDescription>
                        Download ready-to-use templates for bulk operations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {csvTemplates.map((template) => (
                            <div
                                key={template.filename}
                                className="flex items-start justify-between p-4 bg-gray-50 rounded-xl border border-gray-100"
                            >
                                <div className="flex items-start space-x-3">
                                    <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <template.icon className="w-5 h-5 text-red-600" />
                                    </div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">{template.title}</h4>
                                        <p className="text-sm text-gray-500 mt-0.5">{template.description}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDownloadTemplate(template.filename)}
                                    className="flex-shrink-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                                >
                                    <Download className="w-4 h-4 mr-1" />
                                    Download
                                </Button>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Guides */}
            <Card className="border-0 shadow-sm">
                <CardHeader>
                    <CardTitle className="flex items-center text-xl">
                        <BookOpen className="w-5 h-5 mr-2 text-red-600" />
                        Guides & Documentation
                    </CardTitle>
                    <CardDescription>
                        Step-by-step guides for common tasks
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {guides.map((guide) => (
                            <button
                                key={guide.id}
                                onClick={() => setSelectedGuide(guide)}
                                className="p-4 bg-gray-50 rounded-xl border border-gray-100 hover:border-red-200 hover:bg-red-50/30 transition-colors cursor-pointer group text-left"
                            >
                                <div className="flex items-center space-x-3 mb-2">
                                    <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center border border-gray-200 group-hover:border-red-200">
                                        <guide.icon className="w-4 h-4 text-gray-600 group-hover:text-red-600" />
                                    </div>
                                    <h4 className="font-medium text-gray-900">{guide.title}</h4>
                                </div>
                                <p className="text-sm text-gray-500">{guide.description}</p>
                            </button>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Need More Help */}
            <Card className="border-0 shadow-sm bg-gradient-to-br from-red-50 to-white">
                <CardContent className="py-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                                <HelpCircle className="w-6 h-6 text-red-600" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900">Need More Help?</h3>
                                <p className="text-sm text-gray-600">
                                    Contact our support team at{" "}
                                    <a href="mailto:support@mergex.in" className="text-red-600 hover:underline">
                                        support@mergex.in
                                    </a>
                                </p>
                            </div>
                        </div>
                        <Button
                            onClick={handleContactSupport}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            <Mail className="w-4 h-4 mr-2" />
                            Contact Support
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Guide Dialog */}
            <Dialog open={!!selectedGuide} onOpenChange={() => setSelectedGuide(null)}>
                <DialogContent className="max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="flex items-center text-xl">
                            {selectedGuide && (
                                <>
                                    <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center mr-3">
                                        <selectedGuide.icon className="w-4 h-4 text-red-600" />
                                    </div>
                                    {selectedGuide.title}
                                </>
                            )}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedGuide?.description}
                        </DialogDescription>
                    </DialogHeader>

                    {selectedGuide && (
                        <div className="space-y-3 py-4">
                            {selectedGuide.content.map((step, index) => (
                                <div key={index} className="flex items-start space-x-3">
                                    <div className="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                        <span className="text-xs font-medium text-red-600">{index + 1}</span>
                                    </div>
                                    <p className="text-sm text-gray-700">{step}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <div className="flex justify-end pt-4 border-t">
                        <Button variant="outline" onClick={() => setSelectedGuide(null)}>
                            Close
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
