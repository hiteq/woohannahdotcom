import { onCLS, onFCP, onINP, onLCP, onTTFB, type Metric } from 'web-vitals';

declare global {
  interface Window {
    gtag?: (...args: any[]) => void;
  }
}

function sendToAnalytics(metric: Metric) {
  // GA4 event dispatch
  if (typeof window.gtag === 'function') {
    window.gtag('event', metric.name, {
      value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      metric_delta: metric.delta,
      metric_rating: metric.rating,
      page_path: window.location.pathname,
      non_interaction: true,
    });
  }

  // Development mode console feedback
  if (import.meta.env.DEV) {
    const color =
      metric.rating === 'good'
        ? '#10b981'
        : metric.rating === 'needs-improvement'
          ? '#f59e0b'
          : '#ef4444';

    console.log(
      `%c[Web Vitals] ${metric.name}: ${metric.value.toFixed(2)} (${metric.rating})`,
      `color: ${color}; font-weight: bold;`,
      metric
    );
  }
}

// Observe core metrics
onCLS(sendToAnalytics);
onFCP(sendToAnalytics);
onINP(sendToAnalytics);
onLCP(sendToAnalytics);
onTTFB(sendToAnalytics);
