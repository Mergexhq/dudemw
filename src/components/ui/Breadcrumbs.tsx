"use client"

import Link from "next/link"
import { ChevronRight } from "lucide-react"

interface BreadcrumbItem {
    name: string
    url: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="mb-4" aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-2 text-sm text-[#718096]">
                {items.map((item, index) => (
                    <li key={item.url} className="flex items-center gap-2">
                        {index > 0 && <ChevronRight className="h-3 w-3" />}
                        {index === items.length - 1 ? (
                            <span className="font-medium text-gray-900">{item.name}</span>
                        ) : (
                            <Link
                                href={item.url}
                                className="transition-colors hover:text-gray-900 hover:underline"
                            >
                                {item.name}
                            </Link>
                        )}
                    </li>
                ))}
            </ol>
        </nav>
    )
}
