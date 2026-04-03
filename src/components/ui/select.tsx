"use client"

/**
 * DudeSelect — Fully standalone custom dropdown
 * Uses Dude brand colors: Red (#DC2626) + White
 * Drop-in replacement for shadcn Select API
 * Works inside Dialogs, Modals, any z-index context
 */

import React, { useState, useRef, useEffect, createContext, useContext } from "react"
import { ChevronDown, Check } from "lucide-react"
import { cn } from "@/lib/utils"

// ─────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────

interface SelectContextValue {
  value: string | undefined
  onValueChange: (val: string) => void
  isOpen: boolean
  setIsOpen: (open: boolean) => void
  placeholder: string
  disabled: boolean
  selectedLabel: string
  setSelectedLabel: (label: string) => void
}

const SelectContext = createContext<SelectContextValue | null>(null)

function useSelectContext() {
  const ctx = useContext(SelectContext)
  if (!ctx) throw new Error("DudeSelect subcomponent used outside <Select>")
  return ctx
}

// ─────────────────────────────────────────────
// Select (root)
// ─────────────────────────────────────────────

interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  defaultValue?: string
}

export function Select({
  children,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  defaultValue,
}: SelectProps) {
  const [internalValue, setInternalValue] = useState<string | undefined>(defaultValue)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedLabel, setSelectedLabel] = useState("")
  const rootRef = useRef<HTMLDivElement>(null)

  // Support both controlled and uncontrolled
  const resolvedValue = value !== undefined ? value : internalValue

  // Sync selectedLabel when value changes externally
  useEffect(() => {
    if (!resolvedValue) {
      setSelectedLabel("")
    }
  }, [resolvedValue])

  // Click outside to close
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  // Keyboard: Escape to close
  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [isOpen])

  const handleValueChange = (val: string) => {
    if (value === undefined) {
      setInternalValue(val)
    }
    onValueChange?.(val)
    setIsOpen(false)
  }

  return (
    <SelectContext.Provider
      value={{
        value: resolvedValue,
        onValueChange: handleValueChange,
        isOpen,
        setIsOpen,
        placeholder,
        disabled,
        selectedLabel,
        setSelectedLabel,
      }}
    >
      <div ref={rootRef} className="relative w-full">
        {children}
      </div>
    </SelectContext.Provider>
  )
}

// ─────────────────────────────────────────────
// SelectTrigger
// ─────────────────────────────────────────────

interface SelectTriggerProps {
  children?: React.ReactNode
  className?: string
}

export function SelectTrigger({ children, className }: SelectTriggerProps) {
  const { isOpen, setIsOpen, disabled } = useSelectContext()

  return (
    <button
      type="button"
      aria-haspopup="listbox"
      aria-expanded={isOpen}
      disabled={disabled}
      onClick={() => !disabled && setIsOpen(!isOpen)}
      className={cn(
        // Base
        "relative flex h-10 w-full items-center justify-between rounded-lg border px-3 py-2 text-sm",
        "bg-white text-gray-900 outline-none transition-all duration-150",
        // Border states
        "border-gray-200 hover:border-red-400",
        isOpen && "border-red-600 ring-2 ring-red-600/20",
        // Disabled
        disabled && "cursor-not-allowed bg-gray-50 text-gray-400 hover:border-gray-200",
        className
      )}
    >
      {children}
      <ChevronDown
        className={cn(
          "ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
          isOpen && "rotate-180 text-red-500"
        )}
        aria-hidden="true"
      />
    </button>
  )
}

// ─────────────────────────────────────────────
// SelectValue
// ─────────────────────────────────────────────

interface SelectValueProps {
  placeholder?: string
  className?: string
}

export function SelectValue({ placeholder: overridePlaceholder, className }: SelectValueProps) {
  const { value, placeholder, selectedLabel } = useSelectContext()

  const displayLabel = selectedLabel || value || ""
  const displayText = displayLabel || overridePlaceholder || placeholder

  return (
    <span
      className={cn(
        "flex-1 truncate text-left",
        !displayLabel && !value ? "text-gray-400" : "text-gray-900",
        className
      )}
    >
      {displayText}
    </span>
  )
}

// ─────────────────────────────────────────────
// SelectContent
// ─────────────────────────────────────────────

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

export function SelectContent({ children, className }: SelectContentProps) {
  const { isOpen } = useSelectContext()

  if (!isOpen) return null

  return (
    <div
      role="listbox"
      className={cn(
        // positioning & size
        "absolute left-0 right-0 top-full z-9999 mt-1",
        "max-h-60 overflow-y-auto",
        // visuals
        "rounded-lg border border-gray-200 bg-white shadow-lg shadow-gray-200/50",
        // animation
        "animate-in fade-in-0 zoom-in-95 duration-100",
        className
      )}
    >
      {children}
    </div>
  )
}

// ─────────────────────────────────────────────
// SelectItem
// ─────────────────────────────────────────────

interface SelectItemProps {
  value: string
  children: React.ReactNode
  disabled?: boolean
  className?: string
}

export function SelectItem({ value, children, disabled = false, className }: SelectItemProps) {
  const ctx = useSelectContext()
  const isSelected = ctx.value === value
  const label = typeof children === "string" ? children : value

  // Register label for display in SelectValue
  useEffect(() => {
    if (isSelected) {
      ctx.setSelectedLabel(label)
    }
  }, [isSelected, label])

  return (
    <button
      type="button"
      role="option"
      aria-selected={isSelected}
      disabled={disabled}
      onClick={() => {
        if (!disabled) {
          ctx.setSelectedLabel(label)
          ctx.onValueChange(value)
        }
      }}
      className={cn(
        "flex w-full items-center justify-between px-3 py-2.5 text-sm transition-colors text-left",
        // Default
        "text-gray-700 hover:bg-red-50 hover:text-red-700",
        // Selected
        isSelected && "bg-red-50 text-red-700 font-medium",
        // Disabled
        disabled && "cursor-not-allowed opacity-40 hover:bg-transparent hover:text-gray-700",
        className
      )}
    >
      <span className="truncate">{children}</span>
      {isSelected && (
        <Check className="ml-2 h-4 w-4 shrink-0 text-red-600" aria-hidden="true" />
      )}
    </button>
  )
}

// ─────────────────────────────────────────────
// ChevronDown icon — used inside SelectTrigger
// exposed so consumers can use it
// ─────────────────────────────────────────────

export function SelectChevron() {
  const { isOpen } = useSelectContext()
  return (
    <ChevronDown
      className={cn(
        "h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200",
        isOpen && "rotate-180 text-red-500"
      )}
      aria-hidden="true"
    />
  )
}
