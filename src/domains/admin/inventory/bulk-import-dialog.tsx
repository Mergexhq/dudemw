'use client'

import { useState, useRef } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { CSVService } from '@/lib/services/csv'
import { InventoryService } from '@/lib/services/inventory'
import { toast } from 'sonner'
import { Upload, Download, FileText, AlertCircle } from 'lucide-react'

interface BulkImportDialogProps {
  onSuccess: () => void
}

export function BulkImportDialog({ onSuccess }: BulkImportDialogProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDownloadTemplate = () => {
    const template = CSVService.generateInventoryTemplate()
    CSVService.downloadCSV(template, 'inventory-import-template.csv')
    toast.success('Template downloaded')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      setFile(selectedFile)
      setErrors([])
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file')
      return
    }

    setIsProcessing(true)
    setErrors([])

    try {
      const text = await file.text()
      const parseResult = CSVService.parseInventoryCSV(text)

      if (!parseResult.success || !parseResult.data) {
        setErrors(parseResult.errors || ['Failed to parse CSV'])
        toast.error('Failed to parse CSV file')
        setIsProcessing(false)
        return
      }

      // Show warnings if any
      if (parseResult.errors && parseResult.errors.length > 0) {
        setErrors(parseResult.errors)
      }

      // Process bulk adjustments
      const adjustments = parseResult.data.map(row => ({
        variant_id: row.variant_id,
        quantity: parseInt(row.quantity),
        reason: row.reason,
        adjust_type: row.adjustment_type as 'add' | 'subtract' | 'set',
      }))

      const result = await InventoryService.bulkAdjustStock({ adjustments })

      if (result.success && result.data) {
        toast.success(
          `Import completed: ${result.data.succeeded} succeeded, ${result.data.failed} failed`
        )
        if (result.data.succeeded > 0) {
          onSuccess()
          setIsOpen(false)
          setFile(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      } else {
        toast.error(result.error || 'Failed to import inventory')
      }
    } catch (error) {
      console.error('Error importing CSV:', error)
      toast.error('Failed to import inventory')
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" data-testid="bulk-import-button">
          <Upload className="h-4 w-4 mr-2" />
          Bulk Import
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Bulk Import Inventory</DialogTitle>
          <DialogDescription>
            Import multiple inventory adjustments from a CSV file
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Download Template */}
          <div className="flex items-start space-x-3 p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-900">
            <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                Download CSV Template
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                Start with our template to ensure proper formatting
              </p>
              <Button
                type="button"
                variant="link"
                className="h-auto p-0 text-blue-600 dark:text-blue-400 mt-1"
                onClick={handleDownloadTemplate}
              >
                <Download className="h-3 w-3 mr-1" />
                Download Template
              </Button>
            </div>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <label
              htmlFor="csv-file"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Upload CSV File
            </label>
            <input
              ref={fileInputRef}
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {file && (
              <p className="text-xs text-muted-foreground">
                Selected: {file.name} ({(file.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Errors/Warnings */}
          {errors.length > 0 && (
            <div className="space-y-2 p-4 bg-yellow-50 dark:bg-yellow-950/20 rounded-lg border border-yellow-200 dark:border-yellow-900">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                  Validation Warnings
                </p>
              </div>
              <ul className="text-xs text-yellow-700 dark:text-yellow-300 space-y-1 ml-6 list-disc">
                {errors.slice(0, 10).map((error, index) => (
                  <li key={index}>{error}</li>
                ))}
                {errors.length > 10 && (
                  <li className="font-medium">
                    ... and {errors.length - 10} more warnings
                  </li>
                )}
              </ul>
            </div>
          )}

          {/* Instructions */}
          <div className="text-xs text-muted-foreground space-y-1">
            <p className="font-medium">CSV Format Requirements:</p>
            <ul className="list-disc list-inside space-y-0.5 ml-2">
              <li>Include headers: variant_id, sku, adjustment_type, quantity, reason, low_stock_threshold</li>
              <li>adjustment_type must be: add, subtract, or set</li>
              <li>variant_id and quantity are required</li>
              <li>Ensure no empty rows</li>
            </ul>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleImport}
            disabled={!file || isProcessing}
            data-testid="confirm-import-button"
          >
            {isProcessing ? 'Importing...' : 'Import'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
