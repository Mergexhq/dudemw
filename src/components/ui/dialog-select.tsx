"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, Check } from "lucide-react"

interface SelectOption {
    value: string
    label: string
}

interface DialogSelectProps {
    value: string
    onValueChange: (value: string) => void
    options: SelectOption[]
    placeholder?: string
    className?: string
}

/**
 * A custom select component that works inside Dialog modals.
 * Use this instead of the regular Select when inside a Dialog.
 */
export function DialogSelect({
    value,
    onValueChange,
    options,
    placeholder = "Select an option",
    className = "",
}: DialogSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false)
            }
        }
        document.addEventListener("mousedown", handleClickOutside)
        return () => document.removeEventListener("mousedown", handleClickOutside)
    }, [])

    const selectedOption = options.find(opt => opt.value === value)

    return (
        <div ref={dropdownRef} className={`relative ${className}`}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className="flex h-10 w-full items-center justify-between rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm ring-offset-white hover:border-gray-300 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
            >
                <span className={selectedOption ? "text-gray-900" : "text-gray-500"}>
                    {selectedOption?.label || placeholder}
                </span>
                <ChevronDown
                    className={`h-4 w-4 text-gray-500 transition-transform ${isOpen ? "rotate-180" : ""}`}
                />
            </button>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 z-[9999] mt-1 max-h-60 overflow-auto rounded-lg border border-gray-200 bg-white shadow-lg">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => {
                                onValueChange(option.value)
                                setIsOpen(false)
                            }}
                            className={`flex w-full items-center justify-between px-3 py-2.5 text-sm hover:bg-red-50 ${value === option.value ? "bg-red-50 text-red-700" : "text-gray-700"
                                }`}
                        >
                            <span>{option.label}</span>
                            {value === option.value && (
                                <Check className="h-4 w-4 text-red-600" />
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}
