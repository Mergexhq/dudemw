"use client"

import { useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface NumberRangeFilterProps {
    label: string
    value: { min?: number; max?: number } | null
    onChange: (value: { min?: number; max?: number } | null) => void
    className?: string
    placeholder?: { min?: string; max?: string }
}

export function NumberRangeFilter({
    label,
    value,
    onChange,
    className,
    placeholder = { min: "Min", max: "Max" }
}: NumberRangeFilterProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [localMin, setLocalMin] = useState(value?.min?.toString() || "")
    const [localMax, setLocalMax] = useState(value?.max?.toString() || "")

    const isActive = value?.min !== undefined || value?.max !== undefined

    const displayValue = () => {
        if (!isActive) return label

        const min = value?.min
        const max = value?.max

        if (min !== undefined && max !== undefined) {
            return `${min} - ${max}`
        }
        if (min !== undefined) {
            return `≥ ${min}`
        }
        if (max !== undefined) {
            return `≤ ${max}`
        }

        return label
    }

    const handleApply = () => {
        const min = localMin ? parseFloat(localMin) : undefined
        const max = localMax ? parseFloat(localMax) : undefined

        if (min === undefined && max === undefined) {
            onChange(null)
        } else {
            onChange({ min, max })
        }

        setIsOpen(false)
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        setLocalMin("")
        setLocalMax("")
        onChange(null)
        setIsOpen(false)
    }

    const handleOpenChange = (open: boolean) => {
        if (open) {
            setLocalMin(value?.min?.toString() || "")
            setLocalMax(value?.max?.toString() || "")
        }
        setIsOpen(open)
    }

    return (
        <Popover open={isOpen} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "justify-between min-w-[180px]",
                        isActive && "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
                        className
                    )}
                >
                    <span className="truncate">{displayValue()}</span>
                    {isActive && (
                        <X
                            className="h-4 w-4 ml-2 hover:text-red-800"
                            onClick={handleClear}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[280px]" align="start">
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Minimum</label>
                        <Input
                            type="number"
                            placeholder={placeholder.min}
                            value={localMin}
                            onChange={(e) => setLocalMin(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Maximum</label>
                        <Input
                            type="number"
                            placeholder={placeholder.max}
                            value={localMax}
                            onChange={(e) => setLocalMax(e.target.value)}
                            className="w-full"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            className="flex-1"
                            onClick={() => setIsOpen(false)}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                            onClick={handleApply}
                        >
                            Apply
                        </Button>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    )
}
