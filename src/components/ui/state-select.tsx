"use client"

import React, { useState, useRef, useEffect } from "react"
import { stateOptions } from "@/lib/data/indian-states"
import { ChevronDown } from "lucide-react"

interface ThemedStateSelectProps {
  value?: string
  onValueChange?: (value: string) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  name?: string
}

export function ThemedStateSelect({
  value,
  onValueChange,
  placeholder = "Select State",
  disabled = false,
  className = "",
  name = "state",
  ...props
}: ThemedStateSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const filteredStates = stateOptions.filter(state =>
    state.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const selectedState = stateOptions.find(state => state.id === value)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setSearchTerm("")
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (stateValue: string) => {
    onValueChange?.(stateValue)
    setIsOpen(false)
    setSearchTerm("")
  }

  const handleInputClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen)
      if (!isOpen) {
        setTimeout(() => inputRef.current?.focus(), 100)
      }
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleInputClick()
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSearchTerm("")
    }
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Hidden input for form submission */}
      <input type="hidden" name={name} value={value || ""} />
      
      {/* Styled trigger button */}
      <div
        onClick={handleInputClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        className={`
          w-full px-4 py-2 border border-gray-300 rounded-lg 
          focus:outline-none focus:ring-2 focus:ring-black
          cursor-pointer flex items-center justify-between
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-black border-black' : ''}
        `}
        role="combobox"
        aria-expanded={isOpen}
        aria-haspopup="listbox"
      >
        <span className={selectedState ? 'text-gray-900' : 'text-gray-500'}>
          {selectedState ? selectedState.label : placeholder}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${
            isOpen ? 'transform rotate-180' : ''
          }`}
        />
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-hidden">
          {/* Search input */}
          <div className="p-2 border-b border-gray-200">
            <input
              ref={inputRef}
              type="text"
              placeholder="Search states..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-black focus:border-black"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
          
          {/* Options list */}
          <div className="max-h-48 overflow-y-auto" role="listbox">
            {filteredStates.length > 0 ? (
              filteredStates.map((state) => (
                <div
                  key={state.id}
                  onClick={() => handleSelect(state.id)}
                  className={`
                    px-4 py-2 cursor-pointer hover:bg-gray-50 transition-colors
                    ${value === state.id ? 'bg-black text-white hover:bg-gray-800' : 'text-gray-900'}
                  `}
                  role="option"
                  aria-selected={value === state.id}
                >
                  {state.label}
                </div>
              ))
            ) : (
              <div className="px-4 py-2 text-gray-500 text-sm">
                No states found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Export as default for convenience
export default ThemedStateSelect