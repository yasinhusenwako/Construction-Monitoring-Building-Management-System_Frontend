/**
 * Performance monitoring utilities for tracking app performance
 */

interface PerformanceMetric {
  name: string;
  duration: number;
  timestamp: number;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private timers: Map<string, number> = new Map();

  /**
   * Start timing an operation
   */
  start(name: string): void {
    this.timers.set(name, performance.now());
  }

  /**
   * End timing an operation and record the metric
   */
  end(name: string): number | null {
    const startTime = this.timers.get(name);
    if (!startTime) {
      console.warn(`No start time found for metric: ${name}`);
      return null;
    }

    const duration = performance.now() - startTime;
    this.metrics.push({
      name,
      duration,
      timestamp: Date.now(),
    });

    this.timers.delete(name);

    // Log slow operations in development
    if (process.env.NODE_ENV === "development" && duration > 1000) {
      console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`);
    }

    return duration;
  }

  /**
   * Measure an async operation
   */
  async measure<T>(name: string, fn: () => Promise<T>): Promise<T> {
    this.start(name);
    try {
      const result = await fn();
      this.end(name);
      return result;
    } catch (error) {
      this.end(name);
      throw error;
    }
  }

  /**
   * Get all recorded metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter((m) => m.name === name);
  }

  /**
   * Get average duration for a metric
   */
  getAverageDuration(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;

    const total = metrics.reduce((sum, m) => sum + m.duration, 0);
    return total / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
    this.timers.clear();
  }

  /**
   * Log performance summary
   */
  logSummary(): void {
    if (this.metrics.length === 0) {
      console.log("No performance metrics recorded");
      return;
    }

    const grouped = this.metrics.reduce(
      (acc, metric) => {
        if (!acc[metric.name]) {
          acc[metric.name] = [];
        }
        acc[metric.name].push(metric.duration);
        return acc;
      },
      {} as Record<string, number[]>,
    );

    console.group("Performance Summary");
    Object.entries(grouped).forEach(([name, durations]) => {
      const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
      const min = Math.min(...durations);
      const max = Math.max(...durations);
      console.log(
        `${name}: avg=${avg.toFixed(2)}ms, min=${min.toFixed(2)}ms, max=${max.toFixed(2)}ms, count=${durations.length}`,
      );
    });
    console.groupEnd();
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * React hook for measuring component render performance
 */
export function usePerformanceMonitor(componentName: string) {
  if (typeof window === "undefined") return;

  const metricName = `render:${componentName}`;
  performanceMonitor.start(metricName);

  // Cleanup on unmount
  return () => {
    performanceMonitor.end(metricName);
  };
}

/**
 * Measure Web Vitals (Core Web Vitals)
 */
export function measureWebVitals() {
  if (typeof window === "undefined") return;

  // Largest Contentful Paint (LCP)
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log("LCP:", entry);
    }
  });

  try {
    observer.observe({ entryTypes: ["largest-contentful-paint"] });
  } catch (e) {
    // Browser doesn't support this metric
  }

  // First Input Delay (FID)
  const fidObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log("FID:", entry);
    }
  });

  try {
    fidObserver.observe({ entryTypes: ["first-input"] });
  } catch (e) {
    // Browser doesn't support this metric
  }

  // Cumulative Layout Shift (CLS)
  let clsScore = 0;
  const clsObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (!(entry as any).hadRecentInput) {
        clsScore += (entry as any).value;
      }
    }
    console.log("CLS:", clsScore);
  });

  try {
    clsObserver.observe({ entryTypes: ["layout-shift"] });
  } catch (e) {
    // Browser doesn't support this metric
  }
}

/**
 * Log navigation timing
 */
export function logNavigationTiming() {
  if (typeof window === "undefined") return;

  window.addEventListener("load", () => {
    const perfData = window.performance.timing;
    const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
    const connectTime = perfData.responseEnd - perfData.requestStart;
    const renderTime = perfData.domComplete - perfData.domLoading;

    console.group("Navigation Timing");
    console.log(`Page Load Time: ${pageLoadTime}ms`);
    console.log(`Connect Time: ${connectTime}ms`);
    console.log(`Render Time: ${renderTime}ms`);
    console.groupEnd();
  });
}
