// Utility to fix HTTP 431 error caused by excessive localStorage data
function fixStorageIssues() {
  console.log('=== TriSight Storage Fix ===');
  
  // List of keys to preserve
  const keysToPreserve = [
    'twelvedata_api_key',
    'twelvedata_api_key_enc',
    'trisight_session_id',
    'trisight_navbar_symbol',
    'trisight_navbar_symbol_info',
    'chart_settings',
    'user_preferences',
    'storageConsent',
    'trisight_consent'
  ];
  
  // Large data patterns to clean
  const patternsToClean = [
    'trisight_debug_logs',
    'feedback_history',
    'pattern_detection_metrics',
    'stopExitTraceAudit',
    'signalFidelityLogs'
  ];
  
  let totalSizeBefore = 0;
  let totalSizeAfter = 0;
  let itemsCleaned = 0;
  
  // Calculate total size before
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSizeBefore += key.length + value.length;
      }
    }
  }
  
  console.log(`Total storage before: ${(totalSizeBefore / 1024).toFixed(2)} KB`);
  
  // Clean specific large items
  patternsToClean.forEach(pattern => {
    if (localStorage.getItem(pattern)) {
      const size = (localStorage.getItem(pattern) || '').length;
      console.log(`Removing ${pattern}: ${(size / 1024).toFixed(2)} KB`);
      localStorage.removeItem(pattern);
      itemsCleaned++;
    }
  });
  
  // Clean old cache entries
  const keysToRemove = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && (key.startsWith('cache_') || key.startsWith('candlestick_'))) {
      keysToRemove.push(key);
    }
  }
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
    itemsCleaned++;
  });
  
  // Calculate total size after
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSizeAfter += key.length + value.length;
      }
    }
  }
  
  console.log(`Total storage after: ${(totalSizeAfter / 1024).toFixed(2)} KB`);
  console.log(`Freed: ${((totalSizeBefore - totalSizeAfter) / 1024).toFixed(2)} KB`);
  console.log(`Items cleaned: ${itemsCleaned}`);
  console.log('Storage fix complete! Please refresh the page.');
  
  return {
    sizeBefore: totalSizeBefore,
    sizeAfter: totalSizeAfter,
    itemsCleaned: itemsCleaned,
    freedSpace: totalSizeBefore - totalSizeAfter
  };
}

// Make it available globally
window.fixStorageIssues = fixStorageIssues;

// Auto-run if storage is too large
if (typeof localStorage !== 'undefined') {
  let totalSize = 0;
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key) {
      const value = localStorage.getItem(key);
      if (value) {
        totalSize += key.length + value.length;
      }
    }
  }
  
  // If over 2MB, suggest running the fix
  if (totalSize > 2 * 1024 * 1024) {
    console.warn(`LocalStorage is using ${(totalSize / 1024 / 1024).toFixed(2)} MB. Run fixStorageIssues() to clean up.`);
  }
} 