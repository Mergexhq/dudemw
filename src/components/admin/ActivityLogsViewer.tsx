'use client'

import { useState, useEffect } from 'react'
import { Activity, User, Calendar, Filter, Loader2 } from 'lucide-react'

interface ActivityLog {
    id: string
    admin_user_id: string
    action: string
    entity_type: string | null
    entity_id: string | null
    metadata: any
    ip_address: string | null
    user_agent: string | null
    created_at: string
}

export function ActivityLogsViewer() {
    const [logs, setLogs] = useState<ActivityLog[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [filter, setFilter] = useState('')

    useEffect(() => {
        loadLogs()
    }, [])

    const loadLogs = async () => {
        try {
            setIsLoading(true)
            const response = await fetch('/api/admin/activity-logs')
            const data = await response.json()

            if (data.success) {
                setLogs(data.logs || [])
            }
        } catch (error) {
            console.error('Error loading activity logs:', error)
        } finally {
            setIsLoading(false)
        }
    }

    const filteredLogs = logs.filter(log => {
        if (!filter) return true
        const searchStr = filter.toLowerCase()
        return (
            log.action.toLowerCase().includes(searchStr) ||
            log.entity_type?.toLowerCase().includes(searchStr) ||
            log.admin_user_id.toLowerCase().includes(searchStr)
        )
    })

    const getActionColor = (action: string) => {
        if (action.includes('create')) return 'text-green-600 bg-green-50'
        if (action.includes('delete') || action.includes('revoke')) return 'text-red-600 bg-red-50'
        if (action.includes('update') || action.includes('edit')) return 'text-blue-600 bg-blue-50'
        return 'text-gray-600 bg-gray-50'
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-red-600" />
            </div>
        )
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    Activity Logs
                </h3>
                <div className="relative">
                    <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={filter}
                        onChange={(e) => setFilter(e.target.value)}
                        placeholder="Filter logs..."
                        className="pl-9 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                    />
                </div>
            </div>

            {/* Logs List */}
            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-gray-500">
                        No activity logs found
                    </div>
                ) : (
                    <div className="divide-y divide-gray-200">
                        {filteredLogs.map((log) => (
                            <div key={log.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`px-2 py-1 text-xs font-medium rounded ${getActionColor(log.action)}`}>
                                                {log.action}
                                            </span>
                                            {log.entity_type && (
                                                <span className="text-xs text-gray-500">
                                                    {log.entity_type}
                                                </span>
                                            )}
                                        </div>

                                        {log.metadata && Object.keys(log.metadata).length > 0 && (
                                            <div className="text-sm text-gray-600 mt-1">
                                                {Object.entries(log.metadata).map(([key, value]) => (
                                                    <span key={key} className="mr-3">
                                                        <span className="font-medium">{key}:</span> {String(value)}
                                                    </span>
                                                ))}
                                            </div>
                                        )}

                                        <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                                            <span className="flex items-center gap-1">
                                                <User className="w-3 h-3" />
                                                {log.admin_user_id.substring(0, 8)}...
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Calendar className="w-3 h-3" />
                                                {new Date(log.created_at).toLocaleString()}
                                            </span>
                                            {log.ip_address && (
                                                <span>IP: {log.ip_address}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
