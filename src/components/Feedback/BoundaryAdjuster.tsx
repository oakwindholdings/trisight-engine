// src/components/Feedback/BoundaryAdjuster.tsx
// UI for tweaking pattern boundaries
// Used within feedback modals
import React, { useState, useEffect } from 'react';
import styled from 'styled-components';
// Import our type from the declaration file
import type { BoundaryAdjusterProps } from './feedback-components';

const Container = styled.div`
  margin-bottom: 16px;
`;

const Timeline = styled.div`
  position: relative;
  height: 40px;
  margin: 20px 0;
  background-color: #f5f5f5;
  border-radius: 4px;
`;

const TimeMarker = styled.div<{ position: number; type: string; active: boolean }>`
  position: absolute;
  top: 0;
  left: ${props => props.position}%;
  width: 8px;
  height: 40px;
  background-color: ${props => 
    props.type === 'start' 
      ? props.active ? '#4CAF50' : '#81C784' 
      : props.active ? '#F44336' : '#E57373'};
  cursor: ew-resize;
  border-radius: 2px;
  transform: translateX(-50%);
  z-index: 1;
  
  &::after {
    content: "${props => props.type === 'start' ? 'Start' : 'End'}";
    position: absolute;
    bottom: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 12px;
    color: ${props => props.type === 'start' ? '#4CAF50' : '#F44336'};
    white-space: nowrap;
  }
`;

const OriginalMarker = styled.div<{ position: number; type: string }>`
  position: absolute;
  top: 0;
  left: ${props => props.position}%;
  width: 2px;
  height: 40px;
  background-color: ${props => props.type === 'start' ? '#4CAF50' : '#F44336'};
  opacity: 0.5;
  
  &::after {
    content: "Original ${props => props.type === 'start' ? 'Start' : 'End'}";
    position: absolute;
    top: -20px;
    left: 50%;
    transform: translateX(-50%);
    font-size: 10px;
    color: #757575;
    white-space: nowrap;
  }
`;

const PatternSection = styled.div<{ startPos: number; endPos: number }>`
  position: absolute;
  top: 0;
  left: ${props => props.startPos}%;
  width: ${props => props.endPos - props.startPos}%;
  height: 40px;
  background-color: rgba(33, 150, 243, 0.2);
  border: 1px dashed #2196F3;
`;

const TimeDisplay = styled.div`
  display: flex;
  justify-content: space-between;
  margin-top: 24px;
  font-size: 12px;
  color: #757575;
`;

const ResetButton = styled.button`
  background: none;
  border: none;
  color: #1976D2;
  font-size: 12px;
  cursor: pointer;
  margin-top: 8px;
  text-decoration: underline;
  
  &:hover {
    color: #1565C0;
  }
`;

const formatDate = (date: Date): string => {
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });
};

/**
 * Implementation of the BoundaryAdjuster component
 * Using a completely different name to avoid conflicts with declaration files
 */
const BoundaryAdjusterComponent: React.FC<BoundaryAdjusterProps> = ({ originalStart, originalEnd, onChange }) => {
  const [startPos, setStartPos] = useState<number>(0);
  const [endPos, setEndPos] = useState<number>(100);
  const [activeMarker, setActiveMarker] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date>(originalStart);
  const [endDate, setEndDate] = useState<Date>(originalEnd);
  
  // Initialize positions with padding (25% on each side) to allow time extension
  useEffect(() => {
    // Initialize handles at 25% and 75% of the slider
    setStartPos(25);
    setEndPos(75);
    setStartDate(originalStart);
    setEndDate(originalEnd);
  }, [originalStart, originalEnd]);
  
  // Total duration in milliseconds
  const totalDuration = originalEnd.getTime() - originalStart.getTime();
  
  // Calculate extended range (2x the original duration)
  const extendedDuration = totalDuration * 2;
  // Start time for the timeline (50% earlier than original start)
  const timelineStartTime = new Date(originalStart.getTime() - (totalDuration / 2));
  
  const handleMouseDown = (marker: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    setActiveMarker(marker);
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const timeline = document.getElementById('timeline');
      if (!timeline) return;
      
      const rect = timeline.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const width = rect.width;
      
      // Calculate position percentage (clamped between 0-100)
      const pos = Math.max(0, Math.min(100, (x / width) * 100));
      
      if (marker === 'start') {
        if (pos < endPos) {
          setStartPos(pos);
          
          // Calculate new date based on extended timeline
          const offset = (pos / 100) * extendedDuration;
          const newDate = new Date(timelineStartTime.getTime() + offset);
          setStartDate(newDate);
          
          // Notify parent component
          onChange(newDate, null);
        }
      } else if (marker === 'end') {
        if (pos > startPos) {
          setEndPos(pos);
          
          // Calculate new date based on extended timeline
          const offset = (pos / 100) * extendedDuration;
          const newDate = new Date(timelineStartTime.getTime() + offset);
          setEndDate(newDate);
          
          // Notify parent component
          onChange(null, newDate);
        }
      }
    };
    
    const handleMouseUp = () => {
      setActiveMarker(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleReset = () => {
    setStartPos(25);
    setEndPos(75);
    setStartDate(originalStart);
    setEndDate(originalEnd);
    onChange(null, null);
  };
  
  const startChanged = startDate.getTime() !== originalStart.getTime();
  const endChanged = endDate.getTime() !== originalEnd.getTime();
  
  return (
    <Container>
      <Timeline id="timeline">
        {/* Original boundary markers - positioned in the middle (25%-75%) of the extended timeline */}
        <OriginalMarker position={25} type="start" />
        <OriginalMarker position={75} type="end" />
        
        {/* Pattern section */}
        <PatternSection startPos={startPos} endPos={endPos} />
        
        {/* Adjustable markers */}
        <TimeMarker 
          position={startPos} 
          type="start"
          active={activeMarker === 'start'}
          onMouseDown={handleMouseDown('start')}
        />
        <TimeMarker 
          position={endPos} 
          type="end"
          active={activeMarker === 'end'}
          onMouseDown={handleMouseDown('end')}
        />
      </Timeline>
      
      <TimeDisplay>
        <div>
          Start: {formatDate(startDate)}
          {startChanged && ' (Adjusted)'}
        </div>
        <div>
          End: {formatDate(endDate)}
          {endChanged && ' (Adjusted)'}
        </div>
      </TimeDisplay>
      
      {(startChanged || endChanged) && (
        <div style={{ textAlign: 'center' }}>
          <ResetButton onClick={handleReset}>
            Reset to Original Boundaries
          </ResetButton>
        </div>
      )}
    </Container>
  );
};

// Simply export the component directly
export default BoundaryAdjusterComponent;
