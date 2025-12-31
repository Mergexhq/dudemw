"use client"

import { useState, useEffect, useCallback } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"
import { cn } from "@/lib/utils"

interface AdminSearchBarProps {
    value: string
    onChange: (value: string) => void
    placeholder?: string
    debounceMs?: number
    className?: string
    disabled?: boolean
}

export function AdminSearchBar({
    value,
    onChange,
    placeholder = "Search...",
    debounceMs = 300,
    className,
    disabled = false,
}: AdminSearchBarProps) {
    const [localValue, setLocalValue] = useState(value)

    // Sync external value changes
    useEffect(() => {
        setLocalValue(value)
    }, [value])

    // Manual search trigger
    const handleSearch = useCallback(() => {
        onChange(localValue)
    }, [onChange, localValue])

    const handleClear = useCallback(() => {
        setLocalValue("")
        onChange("")
    }, [onChange])

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLInputElement>) => {
            if (e.key === "Enter") {
                handleSearch()
            }
            if (e.key === "Escape") {
                handleClear()
            }
        },
        [handleClear, handleSearch]
    )

    return (
        <div className={cn("relative flex-1 min-w-[200px]", className)}>
            <button
                type="button"
                onClick={handleSearch}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 focus:outline-none"
            >
                <Search className="h-4 w-4" />
            </button>
            <Input
                type="text"
                placeholder={placeholder}
                value={localValue}
                onChange={(e) => setLocalValue(e.target.value)}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                className="pl-9 pr-9 h-10 bg-white border-gray-200 focus:border-red-300 focus:ring-red-200 transition-colors"
                aria-label={placeholder}
            />
            {localValue && !disabled && (
                <button
                    onClick={handleClear}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    aria-label="Clear search"
                    type="button"
                >
                    <X className="h-4 w-4" />
                </button>
            )}
        </div>
    )
}
