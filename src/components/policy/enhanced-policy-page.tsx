'use client'

import { motion } from 'framer-motion'
import Link from 'next/link'
import { ChevronRight, Home } from 'lucide-react'

interface EnhancedPolicyPageProps {
    title: string
    content: string
    slug: string
}

export function EnhancedPolicyPage({ title, content, slug }: EnhancedPolicyPageProps) {
    return (
        <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
            {/* Breadcrumb Navigation */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4 py-3 max-w-6xl">
                    <nav className="flex items-center gap-2 text-sm text-gray-600">
                        <Link href="/" className="hover:text-red-600 transition-colors flex items-center gap-1">
                            <Home className="w-4 h-4" />
                            Home
                        </Link>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-900 font-medium">{title}</span>
                    </nav>
                </div>
            </div>

            {/* Hero Section */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative bg-gradient-to-br from-red-600 via-red-700 to-red-800 text-white py-16 overflow-hidden"
            >
                {/* Decorative Background */}
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 left-0 w-96 h-96 bg-white rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
                    <div className="absolute bottom-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
                </div>

                <div className="container mx-auto px-4 max-w-4xl relative z-10">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="text-4xl md:text-5xl lg:text-6xl font-heading font-bold text-center mb-4"
                    >
                        {title}
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="text-center text-red-100 text-lg"
                    >
                        Last updated: {new Date().toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </motion.p>
                </div>
            </motion.div>

            {/* Content Section */}
            <div className="container mx-auto px-4 max-w-5xl py-12 md:py-16">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden"
                >
                    <div className="p-8 md:p-12">
                        <div
                            className="prose prose-lg prose-red max-w-none
                prose-headings:font-heading prose-headings:font-bold prose-headings:text-gray-900
                prose-h2:text-3xl prose-h2:mb-6 prose-h2:mt-8 prose-h2:pb-3 prose-h2:border-b prose-h2:border-gray-200
                prose-h3:text-2xl prose-h3:mb-4 prose-h3:mt-6 prose-h3:text-red-700
                prose-p:text-gray-700 prose-p:leading-relaxed prose-p:mb-4
                prose-ul:my-4 prose-ul:space-y-2
                prose-li:text-gray-700 prose-li:leading-relaxed
                prose-strong:text-gray-900 prose-strong:font-semibold
                prose-a:text-red-600 prose-a:no-underline hover:prose-a:underline
                prose-img:rounded-xl prose-img:shadow-md"
                            dangerouslySetInnerHTML={{ __html: content }}
                        />
                    </div>

                    {/* Contact CTA */}
                    <div className="bg-gradient-to-r from-gray-50 to-gray-100 px-8 md:px-12 py-8 border-t border-gray-200">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">Need Help?</h3>
                                <p className="text-gray-600">Our customer support team is here to assist you</p>
                            </div>
                            <a
                                href="https://wa.me/919488924935"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-lg transition-colors shadow-md hover:shadow-lg"
                            >
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
                                </svg>
                                Contact on WhatsApp
                            </a>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    )
}
