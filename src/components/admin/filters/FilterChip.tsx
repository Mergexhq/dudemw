"use client"

import { X } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilterChipProps {
    label: string
    value: string
    onRemove: () => void
}

export function FilterChip({ label, value, onRemove }: FilterChipProps) {
    return (
        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700 hover:bg-red-100 transition-colors">
            <span className="font-medium">{label}:</span>
            <span>{value}</span>
            <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-red-200 rounded-full ml-1"
                onClick={onRemove}
            >
                <X className="h-3 w-3" />
            </Button>
        </div>
    )
}
