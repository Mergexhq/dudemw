/**
 * Performance Monitoring Utilities
 * 
 * Track custom performance metrics for critical operations
 */

interface PerformanceMark {
  name: string
  startTime: number
  duration?: number
}

class PerformanceMonitor {
  private marks: Map<string, PerformanceMark> = new Map()
  private measurements: Map<string, number[]> = new Map()

  /**
   * Start measuring performance
   */
  start(name: string) {
    if (typeof window === 'undefined') return

    this.marks.set(name, {
      name,
      startTime: performance.now(),
    })

    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ Started: ${name}`)
    }
  }

  /**
   * End measurement and log results
   */
  end(name: string) {
    if (typeof window === 'undefined') return

    const mark = this.marks.get(name)
    if (!mark) {
      console.warn(`No start mark found for: ${name}`)
      return
    }

    const duration = performance.now() - mark.startTime
    mark.duration = duration

    // Store measurement
    const measurements = this.measurements.get(name) || []
    measurements.push(duration)
    this.measurements.set(name, measurements)

    if (process.env.NODE_ENV === 'development') {
      console.log(`✅ Completed: ${name} in ${duration.toFixed(2)}ms`)
    }

    // Clean up
    this.marks.delete(name)

    return duration
  }

  /**
   * Get average duration for a metric
   */
  getAverage(name: string): number | null {
    const measurements = this.measurements.get(name)
    if (!measurements || measurements.length === 0) return null

    const sum = measurements.reduce((a, b) => a + b, 0)
    return sum / measurements.length
  }

  /**
   * Get all measurements for a metric
   */
  getMeasurements(name: string): number[] {
    return this.measurements.get(name) || []
  }

  /**
   * Clear all measurements
   */
  clear() {
    this.marks.clear()
    this.measurements.clear()
  }

  /**
   * Get performance summary
   */
  getSummary(): Record<string, { count: number; average: number; min: number; max: number }> {
    const summary: Record<string, { count: number; average: number; min: number; max: number }> = {}

    this.measurements.forEach((measurements, name) => {
      if (measurements.length === 0) return

      summary[name] = {
        count: measurements.length,
        average: measurements.reduce((a, b) => a + b, 0) / measurements.length,
        min: Math.min(...measurements),
        max: Math.max(...measurements),
      }
    })

    return summary
  }

  /**
   * Log performance summary
   */
  logSummary() {
    const summary = this.getSummary()
    console.table(summary)
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor()

/**
 * Measure async function performance
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  performanceMonitor.start(name)
  try {
    const result = await fn()
    performanceMonitor.end(name)
    return result
  } catch (error) {
    performanceMonitor.end(name)
    throw error
  }
}

/**
 * Measure sync function performance
 */
export function measureSync<T>(name: string, fn: () => T): T {
  performanceMonitor.start(name)
  try {
    const result = fn()
    performanceMonitor.end(name)
    return result
  } catch (error) {
    performanceMonitor.end(name)
    throw error
  }
}

/**
 * Create a performance mark using the Performance API
 */
export function mark(name: string) {
  if (typeof window === 'undefined') return
  performance.mark(name)
}

/**
 * Measure between two marks
 */
export function measure(name: string, startMark: string, endMark: string) {
  if (typeof window === 'undefined') return
  
  try {
    performance.measure(name, startMark, endMark)
    const measure = performance.getEntriesByName(name, 'measure')[0]
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`📏 ${name}: ${measure.duration.toFixed(2)}ms`)
    }
    
    return measure.duration
  } catch (error) {
    console.warn(`Failed to measure ${name}:`, error)
  }
}

/**
 * Get navigation timing
 */
export function getNavigationTiming() {
  if (typeof window === 'undefined') return null

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  if (!navigation) return null

  return {
    dns: navigation.domainLookupEnd - navigation.domainLookupStart,
    tcp: navigation.connectEnd - navigation.connectStart,
    request: navigation.responseStart - navigation.requestStart,
    response: navigation.responseEnd - navigation.responseStart,
    dom: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
    load: navigation.loadEventEnd - navigation.loadEventStart,
    total: navigation.loadEventEnd - navigation.fetchStart,
  }
}

/**
 * Log navigation timing
 */
export function logNavigationTiming() {
  const timing = getNavigationTiming()
  if (timing) {
    console.table(timing)
  }
}

/**
 * Track component render performance
 */
export function trackRender(componentName: string) {
  if (process.env.NODE_ENV !== 'development') return

  const startTime = performance.now()

  return () => {
    const duration = performance.now() - startTime
    console.log(`🎨 ${componentName} rendered in ${duration.toFixed(2)}ms`)
  }
}
