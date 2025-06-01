// src/utils/debugClickBlocking.ts
// Utility to debug click blocking issues
// Identifies elements that might be blocking user interactions

export function debugClickBlocking() {
  console.log('=== DEBUGGING CLICK BLOCKING ISSUES ===');
  
  // Find all elements with high z-index
  const allElements = document.querySelectorAll('*');
  const highZIndexElements: Array<{element: Element, zIndex: number}> = [];
  
  allElements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    const zIndex = parseInt(computedStyle.zIndex);
    
    if (!isNaN(zIndex) && zIndex > 10) {
      highZIndexElements.push({ element, zIndex });
    }
  });
  
  // Sort by z-index descending
  highZIndexElements.sort((a, b) => b.zIndex - a.zIndex);
  
  console.log('High z-index elements:', highZIndexElements.map(item => ({
    tagName: item.element.tagName,
    className: item.element.className,
    id: item.element.id,
    zIndex: item.zIndex,
    display: window.getComputedStyle(item.element).display,
    visibility: window.getComputedStyle(item.element).visibility,
    pointerEvents: window.getComputedStyle(item.element).pointerEvents,
  })));
  
  // Find all fixed/absolute positioned elements that might be overlays
  const overlayElements: Element[] = [];
  
  allElements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    const position = computedStyle.position;
    
    if (position === 'fixed' || position === 'absolute') {
      const rect = element.getBoundingClientRect();
      const isLargeOverlay = rect.width > window.innerWidth * 0.8 && 
                             rect.height > window.innerHeight * 0.8;
      
      if (isLargeOverlay) {
        overlayElements.push(element);
      }
    }
  });
  
  console.log('Potential overlay elements:', overlayElements.map(element => ({
    tagName: element.tagName,
    className: element.className,
    id: element.id,
    position: window.getComputedStyle(element).position,
    display: window.getComputedStyle(element).display,
    visibility: window.getComputedStyle(element).visibility,
    pointerEvents: window.getComputedStyle(element).pointerEvents,
    dimensions: element.getBoundingClientRect(),
  })));
  
  // Test click at center of screen
  const centerX = window.innerWidth / 2;
  const centerY = window.innerHeight / 2;
  const elementAtCenter = document.elementFromPoint(centerX, centerY);
  
  console.log('Element at center of screen:', {
    element: elementAtCenter,
    tagName: elementAtCenter?.tagName,
    className: elementAtCenter?.className,
    id: elementAtCenter?.id,
  });
  
  // Find elements with pointer-events: none that might be causing issues
  const pointerEventsNoneElements: Element[] = [];
  
  allElements.forEach(element => {
    const computedStyle = window.getComputedStyle(element);
    if (computedStyle.pointerEvents === 'none') {
      pointerEventsNoneElements.push(element);
    }
  });
  
  console.log('Elements with pointer-events: none:', pointerEventsNoneElements.length);
  
  return {
    highZIndexElements,
    overlayElements,
    elementAtCenter,
    pointerEventsNoneElements: pointerEventsNoneElements.length,
  };
}

// Auto-run on window load for debugging
if (typeof window !== 'undefined') {
  (window as any).debugClickBlocking = debugClickBlocking;
}
