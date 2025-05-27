// src/components/Chart/PatternRenderer.tsx
// Renders detected patterns on chart
// Colors based on confidence
import { Pattern, PatternType, patternStyles } from '../../models/PatternTypes';
import { adjustColorSaturation, adjustOpacityHex } from '../../utils/scaling';

interface ChartDimensions {
  width: number;
  height: number;
  margin: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

// Function to apply styling based on pattern confidence
const applyConfidenceStyling = (
  context: CanvasRenderingContext2D,
  pattern: Pattern,
  baseStyle: any
): void => {
  // Map confidence to visual variables
  const opacity = 0.3 + (pattern.confidence * 0.7); // 0.3-1.0 range
  const lineWidth = 1 + (pattern.confidence * 2); // 1-3px range
  
  // Apply dash pattern based on confidence
  if (pattern.confidence > 0.8) {
    context.setLineDash([]); // Solid line
  } else if (pattern.confidence > 0.5) {
    context.setLineDash([4, 2]); // Dashed line
  } else {
    context.setLineDash([2, 4]); // Dotted line
  }
  
  context.globalAlpha = opacity;
  context.lineWidth = lineWidth;
  
  // Apply base color with confidence-based saturation
  const color = adjustColorSaturation(baseStyle.color, 0.5 + (pattern.confidence * 0.5));
  context.strokeStyle = color;
  context.fillStyle = color + adjustOpacityHex(opacity * 0.3);
};

// Implementation with 'Impl' suffix to match declaration in ChartComponents.d.ts
const PatternRendererImpl = {
  render(
    ctx: CanvasRenderingContext2D,
    patterns: Pattern[],
    timeScale: any,
    priceScale: any,
    dimensions: ChartDimensions,
    selectedPattern: Pattern | null
  ) {
    if (!ctx) return;
    
    // Clear the canvas
    ctx.clearRect(0, 0, dimensions.width, dimensions.height);
    
    // Filter patterns that are in the visible range
    const visiblePatterns = patterns.filter(pattern => {
      const patternStartX = timeScale.scale(pattern.startTime);
      const patternEndX = timeScale.scale(pattern.endTime);
      
      return (
        patternEndX >= dimensions.margin.left &&
        patternStartX <= dimensions.width - dimensions.margin.right
      );
    });
    
    // Render each pattern
    visiblePatterns.forEach(pattern => {
      this.renderPattern(ctx, pattern, timeScale, priceScale, dimensions, pattern.id === selectedPattern?.id);
    });
    
    // Render pattern labels after all patterns
    this.renderPatternLabels(ctx, visiblePatterns, timeScale, priceScale, dimensions);
  },
  
  renderPattern(
    ctx: CanvasRenderingContext2D,
    pattern: Pattern,
    timeScale: any,
    priceScale: any,
    dimensions: ChartDimensions,
    isSelected: boolean
  ) {
    // Save current context state
    ctx.save();
    
    // Apply highlighting for selected pattern
    if (isSelected) {
      ctx.shadowColor = 'rgba(33, 150, 243, 0.8)';
      ctx.shadowBlur = 8;
    }
    
    // Get base style for pattern type
    const baseStyle = patternStyles[pattern.type];
    
    // Apply confidence-based styling
    applyConfidenceStyling(ctx, pattern, baseStyle);
    
    // Render based on pattern type
    switch (pattern.type) {
      case PatternType.GOLDMINE_CHANNEL:
        this.renderGoldmineChannel(ctx, pattern, timeScale, priceScale);
        break;
      case PatternType.GOLDMINE_SHAFT:
        this.renderGoldmineShaft(ctx, pattern, timeScale, priceScale);
        break;
      case PatternType.PIVOT:
        this.renderPivot(ctx, pattern, timeScale, priceScale);
        break;
      case PatternType.ROCKETMAN:
        this.renderRocketman(ctx, pattern, timeScale, priceScale);
        break;
      case PatternType.ESCALATOR:
        this.renderEscalator(ctx, pattern, timeScale, priceScale);
        break;
      case PatternType.BLACKJACK:
        this.renderBlackjack(ctx, pattern, timeScale, priceScale);
        break;
    }
    
    // Restore context state
    ctx.restore();
    
    // If pattern has received feedback, show indicator
    if (pattern.hasReceivedFeedback) {
      this.renderFeedbackIndicator(ctx, pattern, timeScale, priceScale);
    }
  },
  
  renderGoldmineChannel(
    ctx: CanvasRenderingContext2D,
    pattern: any,
    timeScale: any,
    priceScale: any
  ) {
    const startX = timeScale.scale(pattern.startTime);
    const endX = timeScale.scale(pattern.endTime);
    const upperY = priceScale.scale(pattern.upperBoundary);
    const lowerY = priceScale.scale(pattern.lowerBoundary);
    
    // Draw channel boundaries
    ctx.beginPath();
    ctx.moveTo(startX, upperY);
    ctx.lineTo(endX, upperY);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(startX, lowerY);
    ctx.lineTo(endX, lowerY);
    ctx.stroke();
    
    // Fill channel area with semi-transparent color
    ctx.beginPath();
    ctx.rect(startX, upperY, endX - startX, lowerY - upperY);
    ctx.fill();
    
    // Draw touch points if available
    if (pattern.touchPoints) {
      pattern.touchPoints.forEach((point: any) => {
        const pointX = timeScale.scale(point.time);
        const pointY = priceScale.scale(point.price);
        
        ctx.beginPath();
        ctx.arc(pointX, pointY, 3, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();
      });
    }
  },
  
  renderGoldmineShaft(
    ctx: CanvasRenderingContext2D,
    pattern: any,
    timeScale: any,
    priceScale: any
  ) {
    const thrustStartX = timeScale.scale(pattern.thrustStartTime);
    const thrustEndX = timeScale.scale(pattern.thrustEndTime);
    const endX = timeScale.scale(pattern.endTime);
    
    // Calculate y-coordinates based on price points
    const thrustStartY = priceScale.scale(
      pattern.direction === 'BULLISH' ? pattern.thrustLowPrice : pattern.thrustHighPrice
    );
    const thrustEndY = priceScale.scale(
      pattern.direction === 'BULLISH' ? pattern.thrustHighPrice : pattern.thrustLowPrice
    );
    const endY = priceScale.scale(
      pattern.direction === 'BULLISH' 
        ? pattern.thrustHighPrice - (pattern.thrustHighPrice - pattern.thrustLowPrice) * pattern.retracementPercentage
        : pattern.thrustLowPrice + (pattern.thrustHighPrice - pattern.thrustLowPrice) * pattern.retracementPercentage
    );
    
    // Draw thrust portion (thicker line)
    ctx.lineWidth += 1; // Make thrust portion thicker
    ctx.beginPath();
    ctx.moveTo(thrustStartX, thrustStartY);
    ctx.lineTo(thrustEndX, thrustEndY);
    ctx.stroke();
    
    // Reset line width for retracement
    ctx.lineWidth -= 1;
    ctx.setLineDash([4, 2]); // Dashed line for retracement
    
    // Draw retracement portion
    ctx.beginPath();
    ctx.moveTo(thrustEndX, thrustEndY);
    ctx.lineTo(endX, endY);
    ctx.stroke();
    
    // Draw arrowhead at thrust end
    const arrowSize = 8;
    ctx.setLineDash([]); // Solid line for arrow
    
    ctx.beginPath();
    ctx.moveTo(thrustEndX, thrustEndY);
    
    if (pattern.direction === 'BULLISH') {
      ctx.lineTo(thrustEndX - arrowSize, thrustEndY + arrowSize);
      ctx.lineTo(thrustEndX + arrowSize, thrustEndY + arrowSize);
    } else {
      ctx.lineTo(thrustEndX - arrowSize, thrustEndY - arrowSize);
      ctx.lineTo(thrustEndX + arrowSize, thrustEndY - arrowSize);
    }
    
    ctx.closePath();
    ctx.fill();
  },
  
  renderPivot(
    ctx: CanvasRenderingContext2D,
    pattern: any,
    timeScale: any,
    priceScale: any
  ) {
    const startX = timeScale.scale(pattern.startTime);
    const endX = timeScale.scale(pattern.endTime);
    const pivotY = priceScale.scale(pattern.pivotLevel);
    
    // Draw horizontal pivot line
    ctx.beginPath();
    ctx.moveTo(startX, pivotY);
    ctx.lineTo(endX, pivotY);
    ctx.stroke();
    
    // Draw triangle markers at touch points
    if (pattern.touchPoints) {
      pattern.touchPoints.forEach((point: any) => {
        const pointX = timeScale.scale(point.time);
        const triangleSize = 6;
        
        ctx.beginPath();
        if (pattern.pivotType === 'SUPPORT') {
          // Triangle pointing up for support
          ctx.moveTo(pointX, pivotY);
          ctx.lineTo(pointX - triangleSize, pivotY + triangleSize);
          ctx.lineTo(pointX + triangleSize, pivotY + triangleSize);
        } else {
          // Triangle pointing down for resistance
          ctx.moveTo(pointX, pivotY);
          ctx.lineTo(pointX - triangleSize, pivotY - triangleSize);
          ctx.lineTo(pointX + triangleSize, pivotY - triangleSize);
        }
        ctx.closePath();
        ctx.fill();
      });
    }
  },
  
  renderRocketman(
    ctx: CanvasRenderingContext2D,
    pattern: any,
    timeScale: any,
    priceScale: any
  ) {
    const startX = timeScale.scale(pattern.startTime);
    const endX = timeScale.scale(pattern.endTime);
    const peakX = timeScale.scale(pattern.peakTime);
    
    const startY = priceScale.scale(pattern.lowPrice);
    const peakY = priceScale.scale(pattern.peakPrice);
    const endY = priceScale.scale(pattern.highPrice);
    
    // Create gradient for the fill
    const gradient = ctx.createLinearGradient(startX, startY, peakX, peakY);
    gradient.addColorStop(0, 'rgba(255, 152, 0, 0.1)');
    gradient.addColorStop(1, `rgba(255, 152, 0, ${pattern.intensity * 0.6})`);
    
    // Draw curved acceleration line
    ctx.beginPath();
    ctx.moveTo(startX, startY);
    
    // Control points for the curve
    const cpX1 = startX + (peakX - startX) * 0.3;
    const cpY1 = startY;
    const cpX2 = startX + (peakX - startX) * 0.7;
    const cpY2 = peakY;
    
    ctx.bezierCurveTo(cpX1, cpY1, cpX2, cpY2, peakX, peakY);
    
    // If there's a continuation after the peak
    if (endX > peakX) {
      const cpX3 = peakX + (endX - peakX) * 0.3;
      const cpY3 = peakY;
      const cpX4 = peakX + (endX - peakX) * 0.7;
      const cpY4 = endY;
      
      ctx.bezierCurveTo(cpX3, cpY3, cpX4, cpY4, endX, endY);
    }
    
    ctx.stroke();
    
    // Draw flame-like marker at start
    const flameSize = 12 * pattern.intensity;
    
    // Save current fill style
    const currentFill = ctx.fillStyle;
    
    // Create flame gradient
    const flameGradient = ctx.createRadialGradient(
      startX, startY, 0,
      startX, startY, flameSize
    );
    
    flameGradient.addColorStop(0, 'rgba(255, 87, 34, 0.9)');
    flameGradient.addColorStop(0.7, 'rgba(255, 193, 7, 0.5)');
    flameGradient.addColorStop(1, 'rgba(255, 235, 59, 0.1)');
    
    ctx.fillStyle = flameGradient;
    
    // Draw flame shape
    ctx.beginPath();
    ctx.moveTo(startX, startY - flameSize);
    
    // Control points for flame curve
    ctx.bezierCurveTo(
      startX + flameSize/2, startY - flameSize*0.8,
      startX + flameSize/2, startY - flameSize*0.3,
      startX, startY
    );
    
    ctx.bezierCurveTo(
      startX - flameSize/2, startY - flameSize*0.3,
      startX - flameSize/2, startY - flameSize*0.8,
      startX, startY - flameSize
    );
    
    ctx.closePath();
    ctx.fill();
    
    // Restore original fill style
    ctx.fillStyle = currentFill;
  },
  
  renderEscalator(
    ctx: CanvasRenderingContext2D,
    pattern: any,
    timeScale: any,
    priceScale: any
  ) {
    if (!pattern.steps || pattern.steps.length === 0) return;
    
    // Draw each step
    pattern.steps.forEach((step: any, index: number) => {
      const stepStartX = timeScale.scale(step.startTime);
      const stepEndX = timeScale.scale(step.endTime);
      const stepY = priceScale.scale(step.level);
      
      // Draw horizontal line at step level
      ctx.beginPath();
      ctx.moveTo(stepStartX, stepY);
      ctx.lineTo(stepEndX, stepY);
      ctx.stroke();
      
      // If consolidation, draw rectangle
      if (step.isConsolidation) {
        const nextStep = pattern.steps[index + 1];
        if (!nextStep) return;
        
        const nextStepY = priceScale.scale(nextStep.level);
        const height = Math.abs(nextStepY - stepY);
        
        ctx.beginPath();
        ctx.rect(stepStartX, Math.min(stepY, nextStepY), stepEndX - stepStartX, height);
        ctx.fillStyle = ctx.fillStyle + '40'; // Add transparency to fill
        ctx.fill();
      }
      
      // Connect to next step with vertical line if not the last step
      if (index < pattern.steps.length - 1) {
        const nextStep = pattern.steps[index + 1];
        const nextStepStartX = timeScale.scale(nextStep.startTime);
        const nextStepY = priceScale.scale(nextStep.level);
        
        ctx.beginPath();
        ctx.moveTo(stepEndX, stepY);
        ctx.lineTo(nextStepStartX, nextStepY);
        ctx.stroke();
      }
    });
  },
  
  renderBlackjack(
    ctx: CanvasRenderingContext2D,
    pattern: any,
    timeScale: any,
    priceScale: any
  ) {
    if (!pattern.priceVolumeCorrelations || pattern.priceVolumeCorrelations.length === 0) return;
    
    // Calculate positions for the score display
    const centerX = timeScale.scale(
      new Date((pattern.startTime.getTime() + pattern.endTime.getTime()) / 2)
    );
    const centerY = priceScale.scale((pattern.highPrice + pattern.lowPrice) / 2);
    
    // Draw card suit symbols at confirmation points
    pattern.priceVolumeCorrelations.forEach((point: any) => {
      const pointX = timeScale.scale(point.time);
      const pointY = priceScale.scale(
        point.priceMovement === 'up' ? pattern.highPrice : pattern.lowPrice
      );
      
      // Skip points with zero value (no correlation)
      if (point.value === 0) return;
      
      // Choose symbol based on value
      let symbol = '';
      if (point.value === 1) {
        symbol = '♠'; // Spade for positive correlation
      } else if (point.value === -1) {
        symbol = '♦'; // Diamond for negative correlation
      }
      
      // Draw the symbol
      ctx.font = '12px Arial';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(symbol, pointX, pointY);
    });
    
    // Draw connection lines to related patterns if any
    if (pattern.relatedPatternIds && pattern.relatedPatternIds.length > 0) {
      ctx.setLineDash([2, 2]);
      ctx.beginPath();
      
      // This would normally connect to other patterns based on their positions
      // For now, we'll just draw lines to the pattern ends
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(timeScale.scale(pattern.startTime), centerY);
      ctx.moveTo(centerX, centerY);
      ctx.lineTo(timeScale.scale(pattern.endTime), centerY);
      
      ctx.stroke();
    }
    
    // Draw numerical confidence display
    const scoreDisplay = Math.round(pattern.score).toString();
    
    // Background for score
    const textWidth = ctx.measureText(scoreDisplay).width;
    const padX = 5, padY = 3;
    
    ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
    ctx.beginPath();
    ctx.rect(
      centerX - textWidth/2 - padX,
      centerY - 6 - padY,
      textWidth + padX*2,
      12 + padY*2
    );
    ctx.fill();
    
    // Score text
    ctx.fillStyle = pattern.score > 10 ? '#4CAF50' : '#FFC107';
    ctx.fillText(scoreDisplay, centerX, centerY);
  },
  
  renderFeedbackIndicator(
    ctx: CanvasRenderingContext2D,
    pattern: Pattern,
    timeScale: any,
    priceScale: any
  ) {
    const endX = timeScale.scale(pattern.endTime);
    const topY = priceScale.scale(pattern.highPrice);
    
    // Draw a checkmark icon to indicate feedback has been received
    ctx.save();
    ctx.strokeStyle = '#4CAF50';
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    
    const size = 10;
    ctx.beginPath();
    ctx.moveTo(endX + size, topY - size);
    ctx.lineTo(endX + size + size/3, topY - size/2);
    ctx.lineTo(endX + size + size, topY - size - size/2);
    ctx.stroke();
    
    ctx.restore();
  },
  
  renderPatternLabels(
    ctx: CanvasRenderingContext2D,
    patterns: Pattern[],
    timeScale: any,
    priceScale: any,
    dimensions: ChartDimensions
  ) {
    const labelPositions = this.placePatternLabels(
      patterns,
      {
        width: dimensions.width,
        height: dimensions.height
      },
      [
        patterns.length > 0 ? patterns[0].startTime : new Date(),
        patterns.length > 0 ? patterns[patterns.length - 1].endTime : new Date()
      ],
      timeScale,
      priceScale
    );
    
    // Render each label
    labelPositions.forEach(label => {
      const pattern = patterns.find(p => p.id === label.patternId);
      if (!pattern) return;
      
      // Get pattern style
      const style = patternStyles[pattern.type];
      
      // Draw label background
      ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
      ctx.strokeStyle = style.color;
      ctx.lineWidth = 1;
      
      ctx.beginPath();
      ctx.rect(label.x, label.y, label.width, label.height);
      ctx.fill();
      ctx.stroke();
      
      // Draw label text
      ctx.font = '10px Arial';
      ctx.fillStyle = '#212121';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      
      const patternTypeText = pattern.type.replace('_', ' ');
      ctx.fillText(
        patternTypeText,
        label.x + label.width / 2,
        label.y + label.height / 2
      );
      
      // Draw leader line if available
      if (label.leaderLine) {
        ctx.beginPath();
        ctx.moveTo(label.leaderLine.start.x, label.leaderLine.start.y);
        ctx.lineTo(label.leaderLine.end.x, label.leaderLine.end.y);
        ctx.stroke();
      }
    });
  },
  
  placePatternLabels(
    patterns: Pattern[],
    chartDimensions: { width: number, height: number },
    visibleDataRange: [Date, Date],
    timeScale: any,
    priceScale: any
  ) {
    // 1. Initial placement based on pattern midpoint
    const initialPositions = patterns.map(pattern => {
      // Determine the y position based on pattern type
      let yPosition;
      if (pattern.type === PatternType.GOLDMINE_CHANNEL) {
        // For Goldmine Channels, make sure we get the actual channel boundaries
        // Instead of using highPrice/lowPrice which might be at chart extremes
        yPosition = priceScale.scale(
          (pattern.upperBoundary + pattern.lowerBoundary) / 2
        );
      } else {
        // For other patterns, use the standard midpoint calculation
        yPosition = priceScale.scale(
          (pattern.highPrice + pattern.lowPrice) / 2
        );
      }
      
      return {
        patternId: pattern.id,
        x: timeScale.scale(new Date((pattern.startTime.getTime() + pattern.endTime.getTime()) / 2)),
        y: yPosition,
        width: 80, // Label width
        height: 24, // Label height
        leaderLine: null
      };
    });
    
    // 2. Detect collisions using rectangle intersection
    const detectCollisions = (positions: any[]) => {
      const collisions: [number, number][] = [];
      
      for (let i = 0; i < positions.length; i++) {
        for (let j = i + 1; j < positions.length; j++) {
          const a = positions[i];
          const b = positions[j];
          
          // Check if rectangles overlap
          if (
            a.x < b.x + b.width &&
            a.x + a.width > b.x &&
            a.y < b.y + b.height &&
            a.y + a.height > b.y
          ) {
            collisions.push([i, j]);
          }
        }
      }
      
      return collisions;
    };
    
    const collisions = detectCollisions(initialPositions);
    
    // 3. Resolve collisions using force-directed placement (simplified)
    const resolveCollisions = (
      positions: any[],
      collisions: [number, number][],
      options: {
        maxIterations: number,
        repulsionForce: number,
        constrainToChart: boolean,
        chartDimensions: { width: number, height: number }
      }
    ) => {
      const { maxIterations, repulsionForce, constrainToChart, chartDimensions } = options;
      
      // Clone positions to avoid modifying the original
      const resolvedPositions = [...positions];
      
      // Simple force-directed algorithm
      for (let iter = 0; iter < maxIterations; iter++) {
        let moved = false;
        
        for (const [i, j] of collisions) {
          const a = resolvedPositions[i];
          const b = resolvedPositions[j];
          
          // Calculate displacement vector
          const dx = b.x - a.x;
          const dy = b.y - a.y;
          const distance = Math.sqrt(dx * dx + dy * dy) || 1;
          
          // Normalized direction vector
          const nx = dx / distance;
          const ny = dy / distance;
          
          // Apply repulsion force
          const force = repulsionForce * (a.width + b.width) / 2;
          
          a.x -= nx * force / 2;
          a.y -= ny * force / 2;
          b.x += nx * force / 2;
          b.y += ny * force / 2;
          
          moved = true;
        }
        
        // Constrain to chart boundaries if required
        if (constrainToChart) {
          for (const pos of resolvedPositions) {
            if (pos.x < 0) pos.x = 0;
            if (pos.y < 0) pos.y = 0;
            if (pos.x + pos.width > chartDimensions.width) {
              pos.x = chartDimensions.width - pos.width;
            }
            if (pos.y + pos.height > chartDimensions.height) {
              pos.y = chartDimensions.height - pos.height;
            }
          }
        }
        
        // Check if there are still collisions
        const newCollisions = detectCollisions(resolvedPositions);
        
        if (newCollisions.length === 0 || !moved) {
          break;
        }
        
        // Update collisions for next iteration
        collisions.length = 0;
        collisions.push(...newCollisions);
      }
      
      return resolvedPositions;
    };
    
    const resolvedPositions = resolveCollisions(initialPositions, collisions, {
      maxIterations: 20, // Reduce for performance
      repulsionForce: 0.2,
      constrainToChart: true,
      chartDimensions
    });
    
    // 4. Connect labels to patterns with leader lines
    const attachLeaderLines = (
      positions: any[],
      patterns: Pattern[],
      timeScale: any,
      priceScale: any
    ) => {
      return positions.map((pos, index) => {
        const pattern = patterns[index];
        
        // Calculate pattern center point
        const patternCenterX = timeScale.scale(
          new Date((pattern.startTime.getTime() + pattern.endTime.getTime()) / 2)
        );
        
        // Get appropriate Y position based on pattern type
        let patternCenterY;
        
        if (pattern.type === PatternType.GOLDMINE_CHANNEL) {
          // For Goldmine Channels, use the actual channel midpoint
          patternCenterY = priceScale.scale(
            (pattern.upperBoundary + pattern.lowerBoundary) / 2
          );
        } else {
          // For other patterns, use the standard midpoint calculation
          patternCenterY = priceScale.scale(
            (pattern.highPrice + pattern.lowPrice) / 2
          );
        }
        
        // Calculate label center
        const labelCenterX = pos.x + pos.width / 2;
        const labelCenterY = pos.y + pos.height / 2;
        
        // Add leader line
        return {
          ...pos,
          leaderLine: {
            start: { x: patternCenterX, y: patternCenterY },
            end: { x: labelCenterX, y: labelCenterY }
          }
        };
      });
    };
    
    return attachLeaderLines(resolvedPositions, patterns, timeScale, priceScale);
  }
};

// Export directly with the name expected by importers
const PatternRenderer = PatternRendererImpl;
export default PatternRenderer;
