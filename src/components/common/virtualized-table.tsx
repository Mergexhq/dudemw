'use client'

import React, { useRef } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Table, TableBody, TableHead, TableHeader, TableRow } from '@/components/ui/table'

interface VirtualizedTableProps<T> {
  data: T[]
  columns: {
    key: string
    header: string
    render: (item: T, index: number) => React.ReactNode
  }[]
  estimatedRowHeight?: number
  overscan?: number
  className?: string
  emptyMessage?: string
  onRowClick?: (item: T, index: number) => void
  isLoading?: boolean
}

export function VirtualizedTable<T>({
  data,
  columns,
  estimatedRowHeight = 60,
  overscan = 5,
  className = '',
  emptyMessage = 'No data available',
  onRowClick,
  isLoading = false,
}: VirtualizedTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)

  const rowVirtualizer = useVirtualizer({
    count: data.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => estimatedRowHeight,
    overscan,
  })

  if (isLoading) {
    return (
      <div className="w-full border rounded-lg overflow-hidden">
        <div className="animate-pulse space-y-2 p-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="w-full border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
        <div className="text-center py-8 text-muted-foreground">
          {emptyMessage}
        </div>
      </div>
    )
  }

  return (
    <div className={`w-full border rounded-lg overflow-hidden ${className}`}>
      {/* Fixed Header */}
      <div className="overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((column) => (
                <TableHead key={column.key}>{column.header}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
        </Table>
      </div>

      {/* Scrollable Body with Virtual Scrolling */}
      <div
        ref={parentRef}
        className="overflow-auto"
        style={{ height: '600px' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          <Table>
            <TableBody>
              {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                const item = data[virtualRow.index]
                return (
                  <TableRow
                    key={virtualRow.index}
                    onClick={() => onRowClick?.(item, virtualRow.index)}
                    className={onRowClick ? 'cursor-pointer hover:bg-muted/50' : ''}
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                    data-index={virtualRow.index}
                  >
                    {columns.map((column) => (
                      <React.Fragment key={column.key}>
                        {column.render(item, virtualRow.index)}
                      </React.Fragment>
                    ))}
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Footer with row count */}
      <div className="border-t px-4 py-2 text-sm text-muted-foreground bg-muted/30">
        Showing {rowVirtualizer.getVirtualItems().length} of {data.length} rows
      </div>
    </div>
  )
}

/**
 * Hook for programmatic scrolling to a specific row
 */
export function useVirtualTableScroll(virtualizer: ReturnType<typeof useVirtualizer>) {
  const scrollToIndex = (index: number, options?: { align?: 'start' | 'center' | 'end' | 'auto' }) => {
    virtualizer.scrollToIndex(index, options)
  }

  const scrollToTop = () => {
    virtualizer.scrollToIndex(0, { align: 'start' })
  }

  const scrollToBottom = () => {
    virtualizer.scrollToIndex(virtualizer.options.count - 1, { align: 'end' })
  }

  return { scrollToIndex, scrollToTop, scrollToBottom }
}
