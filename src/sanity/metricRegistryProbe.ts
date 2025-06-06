// src/sanity/metricRegistryProbe.ts
// Simple probe to verify MetricRegistry can be imported and accessed
// Logs the number of registered metrics for verification

import { MetricRegistry } from '../metrics/registry';

console.log('[Probe]', Object.keys(MetricRegistry).length);
