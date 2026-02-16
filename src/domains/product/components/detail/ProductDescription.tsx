'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

interface ProductDescriptionProps {
    description?: string | null
    variant?: 'mobile' | 'desktop'
}

export default function ProductDescription({ description, variant = 'mobile' }: ProductDescriptionProps) {
    const [isExpanded, setIsExpanded] = useState(false)

    // If no description, don't render anything
    if (!description || description.trim() === '') {
        return null
    }

    // Character limit for collapsed state
    const CHAR_LIMIT = variant === 'mobile' ? 150 : 200

    // Check if description needs truncation
    const needsTruncation = description.length > CHAR_LIMIT
    const displayText = isExpanded || !needsTruncation
        ? description
        : description.slice(0, CHAR_LIMIT) + '...'

    return (
        <div className={`w-full ${variant === 'mobile' ? 'px-4 pb-6' : 'pb-8'}`}>
            <style jsx global>{`
                .product-description p {
                    margin-bottom: 0.75rem;
                }
                .product-description h2,
                .product-description h3 {
                    font-weight: 700;
                    color: #111827;
                    margin-top: 1rem;
                    margin-bottom: 0.5rem;
                }
                .product-description h2 {
                    font-size: 1.125rem;
                }
                .product-description h3 {
                    font-size: 1rem;
                }
                .product-description ul,
                .product-description ol {
                    padding-left: 1.25rem;
                    margin-bottom: 0.75rem;
                }
                .product-description ul {
                    list-style-type: disc;
                }
                .product-description ol {
                    list-style-type: decimal;
                }
                .product-description li {
                    margin-bottom: 0.25rem;
                }
            `}</style>
            <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="bg-white rounded-xl border border-gray-200 overflow-hidden"
            >
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-50 to-white px-5 py-4 border-b border-gray-200">
                    <h2 className="text-lg font-bold text-gray-900 uppercase tracking-wide">
                        Product Description
                    </h2>
                </div>

                {/* Content */}
                <div className="px-5 py-5 overflow-hidden">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={isExpanded ? 'expanded' : 'collapsed'}
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className={`product-description text-gray-700 leading-relaxed max-w-full ${variant === 'mobile' ? 'text-sm' : 'text-base'
                                }`}
                            style={{ overflowWrap: 'break-word', wordBreak: 'normal', whiteSpace: 'normal' }}
                            dangerouslySetInnerHTML={{ __html: displayText }}
                        />
                    </AnimatePresence>

                    {/* Read More/Less Button */}
                    {needsTruncation && (
                        <motion.button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="mt-4 flex items-center gap-2 text-black font-semibold hover:text-gray-700 transition-colors group"
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                        >
                            <span className="uppercase tracking-wide text-sm">
                                {isExpanded ? 'Read Less' : 'Read More'}
                            </span>
                            {isExpanded ? (
                                <ChevronUp className="w-4 h-4 transition-transform group-hover:-translate-y-0.5" />
                            ) : (
                                <ChevronDown className="w-4 h-4 transition-transform group-hover:translate-y-0.5" />
                            )}
                        </motion.button>
                    )}
                </div>
            </motion.div>
        </div>
    )
}
