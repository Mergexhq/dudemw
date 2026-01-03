"use client"

import { useState } from "react"
import { Calendar as CalendarIcon, X } from "lucide-react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { cn } from "@/lib/utils"

interface DateRangeFilterProps {
    label: string
    value: { from?: string; to?: string } | null
    onChange: (value: { from?: string; to?: string } | null) => void
    className?: string
}

export function DateRangeFilter({ label, value, onChange, className }: DateRangeFilterProps) {
    const [isOpen, setIsOpen] = useState(false)

    const fromDate = value?.from ? new Date(value.from) : undefined
    const toDate = value?.to ? new Date(value.to) : undefined

    const isActive = fromDate || toDate

    const displayValue = () => {
        if (!isActive) return label

        if (fromDate && toDate) {
            return `${format(fromDate, "MMM d")} - ${format(toDate, "MMM d, yyyy")}`
        }
        if (fromDate) {
            return `From ${format(fromDate, "MMM d, yyyy")}`
        }
        if (toDate) {
            return `Until ${format(toDate, "MMM d, yyyy")}`
        }

        return label
    }

    const handleSelect = (range: { from?: Date; to?: Date } | undefined) => {
        if (!range) {
            onChange(null)
            return
        }

        onChange({
            from: range.from?.toISOString(),
            to: range.to?.toISOString(),
        })
    }

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange(null)
        setIsOpen(false)
    }

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "justify-between min-w-[240px]",
                        isActive && "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
                        className
                    )}
                >
                    <div className="flex items-center gap-2">
                        <CalendarIcon className="h-4 w-4" />
                        <span className="truncate">{displayValue()}</span>
                    </div>
                    {isActive && (
                        <X
                            className="h-4 w-4 ml-2 hover:text-red-800"
                            onClick={handleClear}
                        />
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                    mode="range"
                    selected={{ from: fromDate, to: toDate }}
                    onSelect={handleSelect}
                    numberOfMonths={2}
                    className="rounded-md border"
                />
            </PopoverContent>
        </Popover>
    )
}
