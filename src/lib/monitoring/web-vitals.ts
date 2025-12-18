/**
 * Web Vitals Monitoring
 * 
 * This module tracks Core Web Vitals and performance metrics
 * https://web.dev/vitals/
 */

import { onCLS, onFCP, onFID, onINP, onLCP, onTTFB, Metric } from 'web-vitals'

type MetricName = 'CLS' | 'FCP' | 'FID' | 'INP' | 'LCP' | 'TTFB'

interface PerformanceReport {
  name: MetricName
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
  navigationType: string
}

/**
 * Log metrics to console in development
 */
function logMetric(metric: Metric) {
  const report: PerformanceReport = {
    name: metric.name as MetricName,
    value: metric.value,
    rating: metric.rating,
    delta: metric.delta,
    id: metric.id,
    navigationType: metric.navigationType,
  }

  if (process.env.NODE_ENV === 'development') {
    console.log('📊 Web Vital:', report)
  }

  // In production, you could send this to an analytics service
  // Example: sendToAnalytics(report)
}

/**
 * Get rating color for console output
 */
function getRatingColor(rating: string): string {
  switch (rating) {
    case 'good':
      return '🟢'
    case 'needs-improvement':
      return '🟡'
    case 'poor':
      return '🔴'
    default:
      return '⚪'
  }
}

/**
 * Format metric value for display
 */
function formatValue(name: MetricName, value: number): string {
  if (name === 'CLS') {
    return value.toFixed(3)
  }
  return `${Math.round(value)}ms`
}

/**
 * Enhanced logging with visual formatting
 */
function logMetricEnhanced(metric: Metric) {
  const rating = getRatingColor(metric.rating)
  const value = formatValue(metric.name as MetricName, metric.value)
  
  console.log(
    `${rating} ${metric.name}: ${value} (${metric.rating})`,
    `\n   Delta: ${formatValue(metric.name as MetricName, metric.delta)}`,
    `\n   Navigation: ${metric.navigationType}`
  )
}

/**
 * Initialize Web Vitals tracking
 */
export function initWebVitals() {
  if (typeof window === 'undefined') return

  // Track all Core Web Vitals
  onCLS(logMetric)
  onFCP(logMetric)
  onFID(logMetric)
  onINP(logMetric)
  onLCP(logMetric)
  onTTFB(logMetric)

  if (process.env.NODE_ENV === 'development') {
    console.log('🚀 Web Vitals monitoring initialized')
  }
}

/**
 * Initialize with enhanced logging (development only)
 */
export function initWebVitalsEnhanced() {
  if (typeof window === 'undefined') return
  if (process.env.NODE_ENV !== 'development') return

  onCLS(logMetricEnhanced)
  onFCP(logMetricEnhanced)
  onFID(logMetricEnhanced)
  onINP(logMetricEnhanced)
  onLCP(logMetricEnhanced)
  onTTFB(logMetricEnhanced)

  console.log('🚀 Enhanced Web Vitals monitoring initialized')
}

/**
 * Export metrics for custom handling
 */
export function reportWebVitals(onPerfEntry?: (metric: Metric) => void) {
  if (onPerfEntry && onPerfEntry instanceof Function) {
    onCLS(onPerfEntry)
    onFCP(onPerfEntry)
    onFID(onPerfEntry)
    onINP(onPerfEntry)
    onLCP(onPerfEntry)
    onTTFB(onPerfEntry)
  }
}

/**
 * Performance thresholds
 */
export const PERFORMANCE_THRESHOLDS = {
  LCP: {
    good: 2500,
    needsImprovement: 4000,
  },
  FID: {
    good: 100,
    needsImprovement: 300,
  },
  CLS: {
    good: 0.1,
    needsImprovement: 0.25,
  },
  FCP: {
    good: 1800,
    needsImprovement: 3000,
  },
  TTFB: {
    good: 800,
    needsImprovement: 1800,
  },
  INP: {
    good: 200,
    needsImprovement: 500,
  },
}
