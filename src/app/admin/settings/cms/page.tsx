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
                {pages.map((page) => (
                    <Link href={`/admin/settings/cms/${page.slug}`} key={page.id} className="block group">
                        <Card className="hover:shadow-lg transition-all duration-300 border-red-100/50 h-full group-hover:border-red-200">
                            <CardHeader className="pb-4">
                                <CardTitle className="flex items-center justify-between text-lg font-medium text-gray-900">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                            <FileText className="w-5 h-5 text-red-600" />
                                        </div>
                                        {page.title}
                                    </div>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center justify-between">
                                    <Badge variant="secondary" className={page.is_published ? "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100" : "bg-gray-100 text-gray-700 hover:bg-gray-200"}>
                                        {page.is_published ? 'Published' : 'Draft'}
                                    </Badge>
                                    <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors transform group-hover:translate-x-1" />
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <p className="text-xs text-gray-400">Last updated {new Date(page.updated_at).toLocaleDateString()}</p>
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}

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

                {/* About Section - Special Card */}
                <Link href="/admin/settings/cms/about" className="block group">
                    <Card className="hover:shadow-lg transition-all duration-300 border-red-100/50 h-full group-hover:border-red-200">
                        <CardHeader className="pb-4">
                            <CardTitle className="flex items-center justify-between text-lg font-medium text-gray-900">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-red-50 rounded-lg group-hover:bg-red-100 transition-colors">
                                        <FileText className="w-5 h-5 text-red-600" />
                                    </div>
                                    About Section
                                </div>
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-between">
                                <Badge variant="secondary" className="bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100">
                                    Features & Stats
                                </Badge>
                                <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-red-500 transition-colors transform group-hover:translate-x-1" />
                            </div>
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <p className="text-xs text-gray-400">Manage About page content</p>
                            </div>
                        </CardContent>
                    </Card>
                </Link>
            </div>
        </div>
    )
}
