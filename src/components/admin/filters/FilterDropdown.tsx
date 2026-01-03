"use client"

import { Check, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"
import { FilterConfig } from "@/hooks/use-admin-filters"

interface FilterDropdownProps {
    config: FilterConfig
    value: any
    onChange: (value: any) => void
    className?: string
}

export function FilterDropdown({ config, value, onChange, className }: FilterDropdownProps) {
    const isActive = value !== null && value !== undefined && value !== ''

    const displayValue = () => {
        if (!isActive) return config.placeholder || config.label

        if (config.type === 'multi_select' && Array.isArray(value)) {
            if (value.length === 0) return config.placeholder || config.label
            if (value.length === 1) {
                const option = config.options?.find(opt => opt.value === value[0])
                return option?.label || value[0]
            }
            return `${value.length} selected`
        }

        const option = config.options?.find(opt => opt.value === value)
        return option?.label || value
    }

    const handleSelect = (optionValue: string) => {
        if (config.type === 'multi_select') {
            const currentValues = Array.isArray(value) ? value : []
            const newValues = currentValues.includes(optionValue)
                ? currentValues.filter(v => v !== optionValue)
                : [...currentValues, optionValue]
            onChange(newValues.length > 0 ? newValues : null)
        } else {
            onChange(value === optionValue ? null : optionValue)
        }
    }

    const isSelected = (optionValue: string) => {
        if (config.type === 'multi_select') {
            return Array.isArray(value) && value.includes(optionValue)
        }
        return value === optionValue
    }

    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button
                    variant="outline"
                    className={cn(
                        "justify-between min-w-[180px]",
                        isActive && "border-red-300 bg-red-50 text-red-700 hover:bg-red-100",
                        className
                    )}
                >
                    <span className="truncate">{displayValue()}</span>
                    <ChevronDown className="ml-2 h-4 w-4 flex-shrink-0" />
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-[200px]">
                {config.options?.map((option) => (
                    <DropdownMenuItem
                        key={option.value}
                        onClick={() => handleSelect(option.value)}
                        className={cn(
                            "cursor-pointer",
                            isSelected(option.value) && "bg-red-50 text-red-700"
                        )}
                    >
                        <div className="flex items-center justify-between w-full">
                            <span>{option.label}</span>
                            {isSelected(option.value) && (
                                <Check className="h-4 w-4 text-red-600" />
                            )}
                        </div>
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
