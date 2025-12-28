"use client"

import React, { createContext, useContext, useState, ReactNode } from 'react'
import { motion } from 'motion/react'

interface TabsContextType {
  activeTab: string
  setActiveTab: (value: string) => void
}

const TabsContext = createContext<TabsContextType | undefined>(undefined)

interface TabsProviderProps {
  children: ReactNode
  defaultValue: string
}

export function TabsProvider({ children, defaultValue }: TabsProviderProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      {children}
    </TabsContext.Provider>
  )
}

interface TabsBtnProps {
  children: ReactNode
  value: string
  className?: string
}

export function TabsBtn({ children, value, className = '' }: TabsBtnProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabsBtn must be used within TabsProvider')
  }

  const { activeTab, setActiveTab } = context
  const isActive = activeTab === value

  return (
    <button
      onClick={() => setActiveTab(value)}
      className={`relative px-4 py-2 text-sm font-medium transition-colors duration-200 ${className} ${
        isActive ? 'text-white' : ''
      }`}
    >
      {isActive && (
        <motion.div
          layoutId="activeTab"
          className="absolute inset-0 bg-red-600 rounded-md shadow-sm"
          initial={false}
          transition={{
            type: "spring",
            stiffness: 500,
            damping: 30
          }}
        />
      )}
      {children}
    </button>
  )
}

interface TabsContentProps {
  children: ReactNode
  value: string
  className?: string
}

export function TabsContent({ children, value, className = '' }: TabsContentProps) {
  const context = useContext(TabsContext)
  if (!context) {
    throw new Error('TabsContent must be used within TabsProvider')
  }

  const { activeTab } = context

  if (activeTab !== value) {
    return null
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {children}
    </motion.div>
  )
}
