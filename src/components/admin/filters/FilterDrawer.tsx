"use client"

import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from "@/components/ui/sheet"
import { FilterConfig } from "@/hooks/use-admin-filters"
import { FilterDropdown } from "./FilterDropdown"
import { DateRangeFilter } from "./DateRangeFilter"
import { NumberRangeFilter } from "./NumberRangeFilter"
import { Separator } from "@/components/ui/separator"

interface FilterDrawerProps {
    isOpen: boolean
    onClose: () => void
    filters: FilterConfig[]
    values: Record<string, any>
    onApply: (values: Record<string, any>) => void
    onClear: () => void
}

export function FilterDrawer({
    isOpen,
    onClose,
    filters,
    values,
    onApply,
    onClear,
}: FilterDrawerProps) {
    const [localValues, setLocalValues] = useState<Record<string, any>>(values)

    // Sync with external values when drawer opens
    useEffect(() => {
        if (isOpen) {
            setLocalValues(values)
        }
    }, [isOpen, values])

    const handleApply = () => {
        onApply(localValues)
        onClose()
    }

    const handleClear = () => {
        setLocalValues({})
        onClear()
        onClose()
    }

    const handleFilterChange = (key: string, value: any) => {
        setLocalValues(prev => ({
            ...prev,
            [key]: value,
        }))
    }

    const renderFilter = (config: FilterConfig) => {
        const value = localValues[config.key]

        switch (config.type) {
            case 'date_range':
                return (
                    <div key={config.key} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            {config.label}
                        </label>
                        <DateRangeFilter
                            label={typeof config.placeholder === 'string' ? config.placeholder : config.label}
                            value={value || null}
                            onChange={(val) => handleFilterChange(config.key, val)}
                            className="w-full"
                        />
                    </div>
                )

            case 'number_range':
                return (
                    <div key={config.key} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            {config.label}
                        </label>
                        <NumberRangeFilter
                            label={config.label}
                            value={value || null}
                            onChange={(val) => handleFilterChange(config.key, val)}
                            placeholder={typeof config.placeholder === 'object' ? config.placeholder : undefined}
                            className="w-full"
                        />
                    </div>
                )

            case 'enum':
            case 'multi_select':
                return (
                    <div key={config.key} className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">
                            {config.label}
                        </label>
                        <FilterDropdown
                            config={config}
                            value={value}
                            onChange={(val) => handleFilterChange(config.key, val)}
                            className="w-full"
                        />
                    </div>
                )

            default:
                return null
        }
    }

    return (
        <Sheet open={isOpen} onOpenChange={onClose}>
            <SheetContent className="w-full sm:max-w-md overflow-y-auto bg-white">
                <SheetHeader>
                    <SheetTitle className="text-xl font-bold">Filters</SheetTitle>
                    <SheetDescription>
                        Refine your results with advanced filters
                    </SheetDescription>
                </SheetHeader>

                <div className="mt-6 space-y-6">
                    {filters.map((config, index) => (
                        <div key={config.key}>
                            {renderFilter(config)}
                            {index < filters.length - 1 && <Separator className="mt-6" />}
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className="sticky bottom-0 left-0 right-0 bg-white border-t pt-4 mt-6 flex gap-3">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={handleClear}
                    >
                        Clear All
                    </Button>
                    <Button
                        className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                        onClick={handleApply}
                    >
                        Apply Filters
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}
