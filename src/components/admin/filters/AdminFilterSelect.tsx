"use client"

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { LucideIcon } from "lucide-react"

export interface FilterOption {
    value: string
    label: string
    disabled?: boolean
}

interface AdminFilterSelectProps {
    value: string
    onChange: (value: string) => void
    options: FilterOption[]
    placeholder: string
    label?: string
    icon?: LucideIcon
    className?: string
    disabled?: boolean
}

export function AdminFilterSelect({
    value,
    onChange,
    options,
    placeholder,
    label,
    icon: Icon,
    className,
    disabled = false,
}: AdminFilterSelectProps) {
    return (
        <div className={cn("flex flex-col gap-1.5", className)}>
            {label && (
                <label className="text-sm font-medium text-gray-700">
                    {label}
                </label>
            )}
            <Select value={value} onValueChange={onChange} disabled={disabled}>
                <SelectTrigger
                    className={cn(
                        "h-10 bg-white border-gray-200 font-medium transition-colors",
                        "hover:border-gray-300 focus:border-red-300 focus:ring-red-200",
                        "disabled:opacity-50 disabled:cursor-not-allowed",
                        Icon ? "pl-9" : ""
                    )}
                >
                    {Icon && (
                        <Icon className="absolute left-3 h-4 w-4 text-gray-500" />
                    )}
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent className="max-h-[300px]">
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                            disabled={option.disabled}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    )
}
