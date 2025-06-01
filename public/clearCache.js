// Utility to clear only cache entries, not API keys or settings
function clearDataCache() {
  const keysToKeep = ['twelvedata_api_key', 'chart_settings', 'user_preferences'];
  const allKeys = Object.keys(localStorage);
  
  let clearedCount = 0;
  allKeys.forEach(key => {
    // Only clear keys that start with 'cache_' or 'candlestick_'
    if ((key.startsWith('cache_') || key.startsWith('candlestick_')) && !keysToKeep.includes(key)) {
      localStorage.removeItem(key);
      clearedCount++;
    }
  });
  
  console.log(`Cleared ${clearedCount} cache entries`);
  console.log('API key and settings preserved');
  return clearedCount;
}

// Make it available globally
window.clearDataCache = clearDataCache;
