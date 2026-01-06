import { getCMSPages } from '@/lib/actions/cms'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { Badge } from '@/components/ui/badge'

// Force dynamic rendering for admin pages
export const dynamic = 'force-dynamic'

export default async function CMSSettingsPage() {
    const pages = await getCMSPages()

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-gray-900">CMS Pages</h1>
                <p className="text-gray-500 mt-2">Manage content for your store's policy and information pages.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {/* About Us */}
                <Link href="/admin/settings/cms/about" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-red-100/50 h-full group-hover:border-red-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between text-lg font-medium text-gray-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    About Us
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100">
                                    Content
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors transform group-hover:translate-x-1" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400">Manage About page content</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* FAQ */}
                <Link href="/admin/settings/cms/faq" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-red-100/50 h-full group-hover:border-red-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between text-lg font-medium text-gray-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    FAQ
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">
                                    Questions & Answers
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors transform group-hover:translate-x-1" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400">Manage frequently asked questions</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Refund Policy */}
                <Link href="/admin/settings/cms/refund" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-red-100/50 h-full group-hover:border-red-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between text-lg font-medium text-gray-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    Refund Policy
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-100 hover:bg-orange-100">
                                    Policy
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors transform group-hover:translate-x-1" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400">Manage refund policy content</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Return Policy */}
                <Link href="/admin/settings/cms/return" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-red-100/50 h-full group-hover:border-red-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between text-lg font-medium text-gray-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    Return Policy
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-teal-50 text-teal-700 border-teal-100 hover:bg-teal-100">
                                    Policy
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors transform group-hover:translate-x-1" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400">Manage return policy content</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>

                {/* Shipping Policy */}
                <Link href="/admin/settings/cms/shipping" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-red-100/50 h-full group-hover:border-red-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between text-lg font-medium text-gray-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    Shipping Policy
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100">
                                    Policy
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors transform group-hover:translate-x-1" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400">Manage shipping policy content</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
                
                {/* Why Dude Section - Special Card */}
                <Link href="/admin/settings/cms/why-dude" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-red-100/50 h-full group-hover:border-red-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between text-lg font-medium text-gray-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    Why Dude Section
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100">
                                    Features
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors transform group-hover:translate-x-1" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400">Manage homepage features</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
