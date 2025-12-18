'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, LayoutDashboard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class AdminErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Admin Error Boundary caught an error:', error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Log to error service with admin context
    this.logAdminError(error, errorInfo)
  }

  logAdminError(error: Error, errorInfo: ErrorInfo) {
    const errorLog = {
      context: 'admin',
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : '',
    }

    if (process.env.NODE_ENV === 'production') {
      // Send to error tracking service
      console.error('Admin error logged:', errorLog)
    } else {
      console.error('Admin Error Details:', errorLog)
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-2xl w-full">
            <div className="bg-white rounded-lg shadow-lg p-8">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>

              <h1 className="text-2xl font-bold text-gray-900 text-center mb-2">
                Admin Panel Error
              </h1>

              <p className="text-gray-600 text-center mb-6">
                An error occurred in the admin panel. This might be due to a temporary issue. Please try refreshing or return to the dashboard.
              </p>

              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6">
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm font-semibold text-red-800 mb-2">
                      Error Details (Development Mode):
                    </p>
                    <p className="text-xs font-mono text-red-700 mb-2">
                      {this.state.error.message}
                    </p>
                    {this.state.error.stack && (
                      <details className="mt-2">
                        <summary className="text-xs font-semibold text-red-700 cursor-pointer hover:text-red-900">
                          View Stack Trace
                        </summary>
                        <pre className="mt-2 text-xs text-red-600 overflow-auto max-h-60 p-2 bg-red-100 rounded">
                          {this.state.error.stack}
                        </pre>
                      </details>
                    )}
                  </div>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                <Button
                  onClick={this.handleReload}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Refresh Page
                </Button>

                <Button
                  asChild
                  variant="outline"
                >
                  <Link href="/admin">
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Back to Dashboard
                  </Link>
                </Button>
              </div>

              {process.env.NODE_ENV === 'development' && (
                <Button
                  onClick={this.handleReset}
                  variant="ghost"
                  className="w-full mt-3"
                >
                  Reset Error State (Dev Only)
                </Button>
              )}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-600">
                  <strong>Troubleshooting Tips:</strong>
                </p>
                <ul className="text-xs text-gray-600 mt-2 space-y-1 list-disc list-inside">
                  <li>Clear your browser cache and reload</li>
                  <li>Check your internet connection</li>
                  <li>Try logging out and back in</li>
                  <li>Contact support if the issue persists</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
