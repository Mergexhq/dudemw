'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { toast } from 'sonner'
import { ArrowLeft, Upload, Download, Loader2, CheckCircle, XCircle, AlertTriangle, FileWarning } from 'lucide-react'
import Link from 'next/link'
import type { PreviewResult, ProductGroup, ImportResult } from '@/types/csv-import.types'

type Step = 'upload' | 'preview' | 'results'

export default function ProductImportPage() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('upload')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [previewData, setPreviewData] = useState<PreviewResult | null>(null)
  const [importResults, setImportResults] = useState<ImportResult | null>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile)
      setPreviewData(null)
      setImportResults(null)
      setCurrentStep('upload')
    } else {
      toast.error('Please select a valid CSV file')
    }
  }

  const handlePreview = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setLoading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/products/import/preview', {
        method: 'POST',
        body: formData,
      })

      const data: PreviewResult = await response.json()

      if (data.success) {
        setPreviewData(data)
        setCurrentStep('preview')
        toast.success(`Preview loaded: ${data.totalProducts} products, ${data.totalVariants} variants`)
      } else {
        toast.error(data.blockingErrors?.[0]?.message || 'Failed to preview import')
      }
    } catch (error) {
      console.error('Error previewing import:', error)
      toast.error('Failed to preview import')
    } finally {
      setLoading(false)
    }
  }

  const handleImport = async () => {
    if (!previewData?.productGroups) {
      toast.error('No data to import')
      return
    }

    setLoading(true)
    setCurrentStep('results')

    try {
      const response = await fetch('/api/admin/products/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productGroups: previewData.productGroups }),
      })

      const data: ImportResult = await response.json()
      setImportResults(data)

      if (data.success) {
        toast.success(`Import completed successfully!`)
      } else {
        toast.error(`Import completed with errors`)
      }
    } catch (error) {
      console.error('Error importing products:', error)
      toast.error('Failed to import products')
    } finally {
      setLoading(false)
    }
  }

  const downloadTemplate = async () => {
    try {
      const response = await fetch('/api/admin/products/import/template')
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = 'product-import-template.csv'
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success('Template downloaded')
    } catch (error) {
      toast.error('Failed to download template')
    }
  }

  const downloadErrorReport = () => {
    if (!importResults?.errors) return

    const errorsCsv = [
      ['Product Handle', 'Variant SKU', 'Error Message', 'Details'],
      ...importResults.errors.map(err => [
        err.productHandle,
        err.variantSku || '',
        err.message,
        err.details || '',
      ])
    ].map(row => row.join(',')).join('\n')

    const blob = new Blob([errorsCsv], { type: 'text/csv' })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'import-errors.csv'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    window.URL.revokeObjectURL(url)
    toast.success('Error report downloaded')
  }

  return (
    <div className="space-y-8" data-testid="product-import-page">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <Link href="/admin/products">
          <Button variant="outline" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-bold tracking-tight text-gray-900">Bulk Import Products</h1>
          <p className="text-lg text-gray-600 mt-2">Import products and variants from CSV file</p>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center space-x-4">
        <div className={`flex items-center space-x-2 ${currentStep === 'upload' ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'upload' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>1</div>
          <span>Upload</span>
        </div>
        <div className="h-0.5 w-16 bg-gray-300" />
        <div className={`flex items-center space-x-2 ${currentStep === 'preview' ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'preview' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>2</div>
          <span>Preview & Confirm</span>
        </div>
        <div className="h-0.5 w-16 bg-gray-300" />
        <div className={`flex items-center space-x-2 ${currentStep === 'results' ? 'text-red-600 font-semibold' : 'text-gray-400'}`}>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${currentStep === 'results' ? 'bg-red-600 text-white' : 'bg-gray-200'}`}>3</div>
          <span>Results</span>
        </div>
      </div>

      {/* Step 1: Upload */}
      {currentStep === 'upload' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50" data-testid="upload-card">
            <CardHeader>
              <CardTitle>Upload CSV File</CardTitle>
              <CardDescription>Select a CSV file to import products and variants</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-red-400 transition-colors bg-white/40">
                <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <label htmlFor="csv-upload" className="cursor-pointer">
                  <span className="text-red-600 hover:text-red-700 font-medium">
                    Choose a CSV file
                  </span>
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleFileChange}
                    disabled={loading}
                    data-testid="csv-file-input"
                  />
                </label>
                {file && (
                  <p className="mt-2 text-sm text-gray-600" data-testid="selected-file-name">{file.name}</p>
                )}
              </div>

              <div className="space-y-3">
                <Button
                  onClick={handlePreview}
                  disabled={!file || loading}
                  className="w-full bg-red-600 hover:bg-red-700 text-white"
                  data-testid="preview-button"
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {loading ? 'Loading Preview...' : 'Preview Import'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50" data-testid="template-card">
            <CardHeader>
              <CardTitle>CSV Template & Guidelines</CardTitle>
              <CardDescription>Download the template to see the required format</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50/50 border border-blue-100 rounded-lg p-4">
                <h4 className="font-semibold text-sm text-blue-900 mb-2">⚠️ Important Rules:</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• <strong>One row = one variant</strong></li>
                  <li>• Group variants by <code>product_handle</code></li>
                  <li>• Preview before importing (mandatory)</li>
                  <li>• SKU must be unique across all products</li>
                  <li>• Prices in Indian Rupees (₹)</li>
                </ul>
              </div>

              <div className="bg-gray-50/50 rounded-lg p-4 border border-gray-100">
                <h4 className="font-semibold text-sm text-gray-900 mb-2">Required Columns:</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <strong>product_handle</strong> - Unique identifier</li>
                  <li>• <strong>product_title</strong> - Product name</li>
                  <li>• <strong>product_status</strong> - draft/published</li>
                  <li>• <strong>product_variant_title</strong> - Variant name</li>
                  <li>• <strong>product_variant_sku</strong> - Unique SKU</li>
                  <li>• <strong>variant_price</strong> - Price in ₹</li>
                </ul>
              </div>

              <Button
                onClick={downloadTemplate}
                variant="outline"
                className="w-full border-gray-200 hover:bg-gray-50"
                data-testid="download-template-button"
              >
                <Download className="mr-2 h-4 w-4" />
                Download CSV Template
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Step 2: Preview & Confirm */}
      {currentStep === 'preview' && previewData && (
        <div className="space-y-6">
          {/* Summary Cards - Row 1 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-gray-900">{previewData.totalProducts}</div>
                <div className="text-sm text-gray-600">Products</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-gray-900">{previewData.totalVariants}</div>
                <div className="text-sm text-gray-600">Variants</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-red-600">{previewData.blockingErrors.length}</div>
                <div className="text-sm text-gray-600">Errors</div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-yellow-600">{previewData.warnings.length}</div>
                <div className="text-sm text-gray-600">Warnings</div>
              </CardContent>
            </Card>
          </div>

          {/* Summary Cards - Row 2: Categories, Collections, Inventory */}
          <div className="grid grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-purple-700">{previewData.totalCategories}</div>
                <div className="text-sm text-purple-600">Categories</div>
                {previewData.uniqueCategories && previewData.uniqueCategories.length > 0 && (
                  <div className="mt-2 text-xs text-purple-500 truncate">
                    {previewData.uniqueCategories.join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-blue-700">{previewData.totalCollections}</div>
                <div className="text-sm text-blue-600">Collections</div>
                {previewData.uniqueCollections && previewData.uniqueCollections.length > 0 && (
                  <div className="mt-2 text-xs text-blue-500 truncate">
                    {previewData.uniqueCollections.join(', ')}
                  </div>
                )}
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="text-2xl font-bold text-green-700">{previewData.totalInventoryItems}</div>
                <div className="text-sm text-green-600">Inventory Items</div>
                <div className="mt-2 text-xs text-green-500">
                  Stock will be updated for each variant
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Errors */}
          {previewData.blockingErrors.length > 0 && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center text-red-900">
                  <XCircle className="mr-2 h-5 w-5" />
                  Blocking Errors ({previewData.blockingErrors.length})
                </CardTitle>
                <CardDescription className="text-red-700">
                  These errors must be fixed before importing
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {previewData.blockingErrors.slice(0, 10).map((error, index) => (
                    <div key={index} className="text-sm text-red-800 bg-white p-2 rounded">
                      <strong>Row {error.row}</strong> - {error.field}: {error.message}
                    </div>
                  ))}
                  {previewData.blockingErrors.length > 10 && (
                    <div className="text-sm text-red-700 italic">
                      ... and {previewData.blockingErrors.length - 10} more errors
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Warnings */}
          {previewData.warnings.length > 0 && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center text-yellow-900">
                  <AlertTriangle className="mr-2 h-5 w-5" />
                  Warnings ({previewData.warnings.length})
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  These warnings won't block import but should be reviewed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {previewData.warnings.slice(0, 10).map((warning, index) => (
                    <div key={index} className="text-sm text-yellow-800 bg-white p-2 rounded">
                      <strong>Row {warning.row}</strong> - {warning.field}: {warning.message}
                    </div>
                  ))}
                  {previewData.warnings.length > 10 && (
                    <div className="text-sm text-yellow-700 italic">
                      ... and {previewData.warnings.length - 10} more warnings
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Product Groups Preview */}
          <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
            <CardHeader>
              <CardTitle>Products to Import</CardTitle>
              <CardDescription>
                Grouped by product_handle - each product with its variants
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {previewData.productGroups.slice(0, 20).map((group, index) => (
                  <div key={index} className="border rounded-lg p-4 bg-white/60">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-gray-900">{group.title}</h4>
                        <p className="text-sm text-gray-600">Handle: {group.handle}</p>
                      </div>
                      <div className="text-sm text-gray-500">
                        {group.variants.length} variant{group.variants.length !== 1 ? 's' : ''}
                      </div>
                    </div>
                    {group.errors.length > 0 && (
                      <div className="text-xs text-red-600 mb-2">
                        ⚠️ {group.errors.length} error(s)
                      </div>
                    )}
                    <div className="space-y-1">
                      {group.variants.map((variant, vIdx) => (
                        <div key={vIdx} className="text-sm text-gray-700 flex justify-between bg-gray-50 p-2 rounded">
                          <span>{variant.title} - {variant.sku}</span>
                          <span className="font-medium">₹{variant.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {previewData.productGroups.length > 20 && (
                  <div className="text-sm text-gray-500 text-center italic">
                    ... and {previewData.productGroups.length - 20} more products
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep('upload')
                setPreviewData(null)
              }}
              className="border-gray-200"
            >
              Back to Upload
            </Button>

            <Button
              onClick={handleImport}
              disabled={loading || previewData.blockingErrors.length > 0}
              className="bg-red-600 hover:bg-red-700 text-white"
              data-testid="confirm-import-button"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Importing...' : 'Confirm & Import'}
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {currentStep === 'results' && loading && !importResults && (
        <div className="flex flex-col items-center justify-center py-16 space-y-6">
          <Loader2 className="h-16 w-16 animate-spin text-red-600" />
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900">Importing Products...</h3>
            <p className="text-gray-600 mt-2">Please wait while we process your CSV file.</p>
            <p className="text-sm text-gray-500 mt-1">This may take a few moments depending on the file size.</p>
          </div>
        </div>
      )}
      {currentStep === 'results' && importResults && (
        <div className="space-y-6">
          {/* Success/Failure Banner */}
          <Card className={`border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50 ${importResults.success ? 'border-green-200' : 'border-yellow-200'}`}>
            <CardHeader>
              <CardTitle className={`flex items-center ${importResults.success ? 'text-green-900' : 'text-yellow-900'}`}>
                {importResults.success ? (
                  <>
                    <CheckCircle className="mr-2 h-6 w-6" />
                    Import Completed Successfully!
                  </>
                ) : (
                  <>
                    <FileWarning className="mr-2 h-6 w-6" />
                    Import Completed with Errors
                  </>
                )}
              </CardTitle>
              <CardDescription className={importResults.success ? 'text-green-700' : 'text-yellow-700'}>
                Duration: {(importResults.duration / 1000).toFixed(2)}s
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Results Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{importResults.productsCreated}</div>
                    <div className="text-sm text-gray-600">Products Created</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{importResults.productsUpdated}</div>
                    <div className="text-sm text-gray-600">Products Updated</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-600">{importResults.variantsCreated}</div>
                    <div className="text-sm text-gray-600">Variants Created</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-600">{importResults.variantsUpdated}</div>
                    <div className="text-sm text-gray-600">Variants Updated</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-red-600">{importResults.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                  <XCircle className="h-8 w-8 text-red-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Categories, Collections, Inventory Results */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-purple-700">{importResults.categoriesLinked}</div>
                    <div className="text-sm text-purple-600">Categories Linked</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-blue-700">{importResults.collectionsLinked}</div>
                    <div className="text-sm text-blue-600">Collections Linked</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-2xl font-bold text-green-700">{importResults.inventoryUpdated}</div>
                    <div className="text-sm text-green-600">Inventory Updated</div>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Error Details */}
          {importResults.errors && importResults.errors.length > 0 && (
            <Card className="border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
              <CardHeader>
                <CardTitle className="flex items-center justify-between text-red-900">
                  <span className="flex items-center">
                    <XCircle className="mr-2 h-5 w-5" />
                    Import Errors ({importResults.errors.length})
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={downloadErrorReport}
                    className="text-red-700 border-red-300"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download Error Report
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="max-h-96 overflow-y-auto space-y-2">
                  {importResults.errors.map((error, index) => (
                    <div key={index} className="text-sm bg-red-50 p-3 rounded border border-red-200">
                      <div className="font-medium text-red-900">
                        {error.productHandle} {error.variantSku && `(${error.variantSku})`}
                      </div>
                      <div className="text-red-700">{error.message}</div>
                      {error.details && (
                        <div className="text-red-600 text-xs mt-1">{error.details}</div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={() => {
                setFile(null)
                setPreviewData(null)
                setImportResults(null)
                setCurrentStep('upload')
              }}
              className="border-gray-200"
            >
              Import Another File
            </Button>
            <Link href="/admin/products">
              <Button className="bg-red-600 hover:bg-red-700 text-white" data-testid="view-products-button">
                View Products
              </Button>
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}
