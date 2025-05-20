import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
import { GoldmineChannelPattern } from '../../models/PatternTypes';

interface GoldmineChannelAdjusterProps {
  pattern: GoldmineChannelPattern;
  onChange: (upperBoundary: number, lowerBoundary: number) => void;
}

const Container = styled.div`
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  align-items: center; /* Center the control */
`;

const Timeline = styled.div`
  position: relative;
  height: 80px; /* Double the height for better separation */
  width: 60%; /* Reduce width by 40% */
  margin: 30px 0 50px 0; /* Increased margins for more space */
  background-color: #f5f5f5;
  border-radius: 4px;
`;

const ChannelVisualization = styled.div<{ top: number; bottom: number }>`
  position: absolute;
  left: 0;
  top: ${props => 100 - props.top}%;
  width: 100%;
  height: ${props => props.top - props.bottom}%;
  background-color: rgba(30, 136, 229, 0.2);
  border-top: 1px dashed #1E88E5;
  border-bottom: 1px dashed #1E88E5;
  z-index: 0;
`;

const OriginalBoundaryLine = styled.div<{ position: number; isUpper: boolean }>`
  position: absolute;
  left: 0;
  top: ${props => 100 - props.position}%;
  width: 100%;
  height: 2px;
  background-color: #9E9E9E; /* Gray color matching time boundary markers */
  opacity: 0.6;
  z-index: 1;
  
  &::before {
    content: "Original ${props => props.isUpper ? 'Upper' : 'Lower'}";
    position: absolute;
    left: -80px;
    top: -10px;
    font-size: 10px;
    font-weight: bold;
    color: #616161;
  }
`;

const BoundarySlider = styled.div<{ position: number; isUpper: boolean; active: boolean }>`
  position: absolute;
  left: 0;
  top: ${props => 100 - props.position}%;
  width: 100%;
  height: 12px; /* Increased thickness */
  background-color: ${props => 
    props.isUpper 
      ? props.active ? '#43A047' : '#81C784' // Green for upper boundary
      : props.active ? '#E53935' : '#EF5350'}; // Red for lower boundary
  cursor: ns-resize;
  z-index: 2;
  border: 1px solid ${props => props.isUpper ? '#2E7D32' : '#C62828'}; /* Added border for definition */
  box-shadow: 0 1px 3px rgba(0,0,0,0.12); /* Added subtle shadow */
  
  &::after {
    content: "${props => props.isUpper ? 'Upper' : 'Lower'}";
    position: absolute;
    right: -50px; /* Moved closer to control */
    top: -12px;
    font-size: 13px;
    font-weight: bold;
    color: ${props => props.isUpper ? '#43A047' : '#E53935'};
    white-space: nowrap;
  }
  
  /* Add price label on the left side */
  &::before {
    content: "$";
    position: absolute;
    left: -20px; /* Moved closer to control */
    top: -6px;
    font-size: 13px;
    font-weight: bold;
    color: ${props => props.isUpper ? '#43A047' : '#E53935'};
  }
`;

const PriceDisplay = styled.div<{ isUpper: boolean }>`
  position: absolute;
  left: 5px;
  top: ${props => props.isUpper ? -5 : 15}px;
  font-size: 12px;
  color: #212121;
  font-weight: bold;
`;

const ChannelMetrics = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 30px;
  font-size: 12px;
  padding: 8px;
  background-color: #f5f5f5;
  border-radius: 4px;
  width: 95%; /* Match parent container but leave a bit of margin */
  align-self: center;
`;

const MetricItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const MetricLabel = styled.div`
  color: #757575;
  margin-bottom: 4px;
`;

const MetricValue = styled.div`
  color: #212121;
  font-weight: bold;
`;

const ResetButton = styled.button`
  background: none;
  border: none;
  color: #1976D2;
  font-size: 12px;
  cursor: pointer;
  margin-top: 16px;
  text-decoration: underline;
  display: block;
  margin-left: auto;
  margin-right: auto;
  
  &:hover {
    color: #1565C0;
  }
`;

const formatPrice = (price: number): string => {
  return price.toFixed(2);
};

const GoldmineChannelAdjuster: React.FC<GoldmineChannelAdjusterProps> = ({ 
  pattern,
  onChange
}) => {
  // Create a fixed visualization range centered on the channel height
  // Calculate the midpoint of the channel
  const channelMidpoint = (pattern.upperBoundary + pattern.lowerBoundary) / 2;
  const channelHeight = pattern.upperBoundary - pattern.lowerBoundary;
  
  // Create extended range that's 4x the channel height (2x above, 2x below)
  const extendedRange = channelHeight * 4;
  
  // Min and max prices for visualization (centered on channel midpoint)
  const minPrice = channelMidpoint - (extendedRange / 2);
  const maxPrice = channelMidpoint + (extendedRange / 2);
  const visualizationRange = maxPrice - minPrice;
  
  // Calculate percentages for position in visualization
  const calculatePercentage = (price: number): number => {
    return ((price - minPrice) / visualizationRange) * 100;
  };
  
  // Calculate price from percentage position
  const calculatePrice = (percentage: number): number => {
    return minPrice + (percentage / 100) * visualizationRange;
  };
  
  // Calculate target positions for upper and lower boundaries with spacing that ensures lower boundary isn't flush with bottom
  const targetLowerPos = 25; // 25% from bottom (ensure visible space below for downward movement)
  const targetUpperPos = 85; // 85% from bottom (15% from top)
  
  // Original boundary positions as percentages (for visualization only)
  const originalUpperPercentage = calculatePercentage(pattern.upperBoundary);
  const originalLowerPercentage = calculatePercentage(pattern.lowerBoundary);
  
  // State for current positions (as percentages)
  const [upperPos, setUpperPos] = useState<number>(targetUpperPos);
  const [lowerPos, setLowerPos] = useState<number>(targetLowerPos);
  const [activeSlider, setActiveSlider] = useState<string | null>(null);
  
  // Calculate initial boundary prices based on the target percentages
  const initialUpperPrice = calculatePrice(targetUpperPos);
  const initialLowerPrice = calculatePrice(targetLowerPos);
  
  // State for boundary prices
  const [upperBoundary, setUpperBoundary] = useState<number>(initialUpperPrice);
  const [lowerBoundary, setLowerBoundary] = useState<number>(initialLowerPrice);
  
  // Initialize positions
  useEffect(() => {
    // Initialize to the target positions (25% and 75%)
    setUpperPos(targetUpperPos);
    setLowerPos(targetLowerPos);
    setUpperBoundary(initialUpperPrice);
    setLowerBoundary(initialLowerPrice);
  }, [pattern, targetUpperPos, targetLowerPos, initialUpperPrice, initialLowerPrice]);
  
  const handleMouseDown = (slider: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveSlider(slider);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const container = document.getElementById('channel-container');
      if (!container) return;
      
      const rect = container.getBoundingClientRect();
      const y = moveEvent.clientY - rect.top;
      const height = rect.height;
      
      // Calculate position percentage (clamped between 0-100)
      // Invert Y axis since 0% is bottom and 100% is top
      const pos = Math.max(0, Math.min(100, 100 - (y / height) * 100));
      
      if (slider === 'upper') {
        if (pos > lowerPos + 5) { // Ensure minimum channel height
          setUpperPos(pos);
          
          // Calculate new price
          const newPrice = calculatePrice(pos);
          setUpperBoundary(newPrice);
          
          // Notify parent component
          onChange(newPrice, lowerBoundary);
        }
      } else if (slider === 'lower') {
        if (pos < upperPos - 5) { // Ensure minimum channel height
          setLowerPos(pos);
          
          // Calculate new price
          const newPrice = calculatePrice(pos);
          setLowerBoundary(newPrice);
          
          // Notify parent component
          onChange(upperBoundary, newPrice);
        }
      }
    };
    
    const handleMouseUp = () => {
      setActiveSlider(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleReset = () => {
    // Reset to the target positions (25% and 75%)
    setUpperPos(targetUpperPos);
    setLowerPos(targetLowerPos);
    setUpperBoundary(initialUpperPrice);
    setLowerBoundary(initialLowerPrice);
    onChange(initialUpperPrice, initialLowerPrice);
  };
  
  const upperChanged = upperBoundary !== initialUpperPrice;
  const lowerChanged = lowerBoundary !== initialLowerPrice;
  const currentChannelHeight = upperBoundary - lowerBoundary;
  const channelPercentage = (currentChannelHeight / lowerBoundary) * 100;
  
  return (
    <Container>
      <Timeline id="channel-container">
        {/* Original boundary markers */}
        <OriginalBoundaryLine position={originalUpperPercentage} isUpper={true} />
        <OriginalBoundaryLine position={originalLowerPercentage} isUpper={false} />
        
        {/* Channel visualization */}
        <ChannelVisualization top={upperPos} bottom={lowerPos} />
        
        {/* Adjustable sliders */}
        <BoundarySlider 
          position={upperPos} 
          isUpper={true}
          active={activeSlider === 'upper'}
          onMouseDown={handleMouseDown('upper')}
        >
          <PriceDisplay isUpper={true}>
            ${formatPrice(upperBoundary)}
            {upperChanged && ' ↑'}
          </PriceDisplay>
        </BoundarySlider>
        
        <BoundarySlider 
          position={lowerPos} 
          isUpper={false}
          active={activeSlider === 'lower'}
          onMouseDown={handleMouseDown('lower')}
        >
          <PriceDisplay isUpper={false}>
            ${formatPrice(lowerBoundary)}
            {lowerChanged && ' ↓'}
          </PriceDisplay>
        </BoundarySlider>
      </Timeline>
      
      <ChannelMetrics>
        <MetricItem>
          <MetricLabel>Upper Boundary</MetricLabel>
          <MetricValue>${formatPrice(upperBoundary)}</MetricValue>
        </MetricItem>
        
        <MetricItem>
          <MetricLabel>Lower Boundary</MetricLabel>
          <MetricValue>${formatPrice(lowerBoundary)}</MetricValue>
        </MetricItem>
        
        <MetricItem>
          <MetricLabel>Channel Height</MetricLabel>
          <MetricValue>${formatPrice(currentChannelHeight)}</MetricValue>
        </MetricItem>
        
        <MetricItem>
          <MetricLabel>Percentage</MetricLabel>
          <MetricValue>{channelPercentage.toFixed(2)}%</MetricValue>
        </MetricItem>
      </ChannelMetrics>
      
      {(upperChanged || lowerChanged) && (
        <ResetButton onClick={handleReset}>
          Reset to Original Boundaries
        </ResetButton>
      )}
    </Container>
  );
};

export default GoldmineChannelAdjuster;
