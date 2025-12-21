"use client"

import React from "react"
import { Select as BaseSelect } from "@/components/base/select/select"
import type { SelectItemType } from "@/components/base/select/select"

interface SelectItemProps {
  value: string
  children: React.ReactNode
}

interface SelectContentProps {
  children: React.ReactNode
  className?: string
}

interface SelectProps {
  children: React.ReactNode
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
}

// Compatibility wrapper for the new select component
export function Select({
  children,
  value,
  onValueChange,
  placeholder = "Select an option",
  disabled = false,
  ...props
}: SelectProps) {
  // Extract items from SelectContent > SelectItem children
  const items: SelectItemType[] = []
  let contentClassName: string | undefined

  const extractItems = (children: React.ReactNode) => {
    React.Children.forEach(children, (child) => {
      if (React.isValidElement(child)) {
        if (child.type === SelectContent) {
          // Extract items from SelectContent children
          const contentProps = child.props as SelectContentProps
          if (contentProps.className) {
            contentClassName = contentProps.className
          }
          extractItems(contentProps.children)
        } else if (child.type === SelectItem) {
          const itemProps = child.props as SelectItemProps
          items.push({
            id: itemProps.value,
            label: typeof itemProps.children === 'string' ? itemProps.children : itemProps.value,
          })
        }
      }
    })
  }

  extractItems(children)

  return (
    <BaseSelect
      items={items}
      selectedKey={value}
      onSelectionChange={(key: React.Key | null) => {
        if (key !== null) {
          onValueChange?.(key as string)
        }
      }}
      placeholder={placeholder}
      isDisabled={disabled}
      popoverClassName={contentClassName}
      {...props}
    >
      {(item) => (
        <BaseSelect.Item key={item.id} id={item.id}>
          {item.label}
        </BaseSelect.Item>
      )}
    </BaseSelect>
  )
}

export function SelectContent({ children, className }: SelectContentProps) {
  return <>{children}</>
}

export function SelectItem({ value, children }: SelectItemProps) {
  return null // This is just for type compatibility, actual rendering happens in Select
}

export function SelectTrigger({ children, className }: { children: React.ReactNode; className?: string }) {
  return <>{children}</>
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  return null // This is handled internally by the new select component
}
