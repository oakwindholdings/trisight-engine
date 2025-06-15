// src/pages/PatternDemo.tsx
// Demonstration page for pattern visualization
// Shows escalator detection, goldmine signals, and trailing stops

import React, { useMemo } from 'react';
import styled from 'styled-components';
import InfiniteZoomChart from '../components/Chart/InfiniteZoomChart';
import { CandlestickData } from '../models/ChartTypes';
import { Pattern, PatternType, ThrustDirection } from '../models/PatternTypes';

const Container = styled.div`
  padding: 20px;
  background: #f5f5f5;
  min-height: 100vh;
`;

const Header = styled.h1`
  color: #1e293b;
  margin-bottom: 10px;
`;

const Description = styled.p`
  color: #64748b;
  margin-bottom: 30px;
  max-width: 800px;
`;

const ChartWrapper = styled.div`
  background: white;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
`;

const PatternInfo = styled.div`
  margin-top: 20px;
  padding: 15px;
  background: #f0f9ff;
  border-left: 4px solid #2196f3;
  border-radius: 4px;
  
  h3 {
    margin-top: 0;
    color: #1976d2;
  }
  
  ul {
    margin: 10px 0;
    padding-left: 20px;
  }
  
  li {
    margin: 5px 0;
  }
`;

const PatternDemo: React.FC = () => {
  // Generate demonstration data with an escalator pattern
  const demoData = useMemo(() => {
    const baseTime = new Date('2025-01-15T09:30:00').getTime();
    const data: CandlestickData[] = [];
    
    // Create 100 candles with an escalator pattern in the middle
    for (let i = 0; i < 100; i++) {
      const time = baseTime + i * 60000; // 1-minute candles
      let open = 100 + Math.sin(i / 10) * 2;
      let close = open;
      let high = open;
      let low = open;
      
      if (i >= 40 && i <= 48) {
        // Rising escalator pattern
        open = 100 + (i - 40) * 0.5;
        close = open + 0.3 + Math.random() * 0.1;
        high = close + Math.random() * 0.1;
        low = open - Math.random() * 0.05;
      } else if (i === 49) {
        // Breakout candle - trades through floor for SHORT signal
        open = 104.2;
        close = 103.8;
        high = 104.3;
        low = 103.5; // Breaks below escalator floor
      } else if (i > 49 && i < 60) {
        // Downtrend after goldmine signal
        open = 104 - (i - 49) * 0.2;
        close = open - Math.random() * 0.2;
        high = Math.max(open, close) + Math.random() * 0.1;
        low = Math.min(open, close) - Math.random() * 0.1;
      } else {
        // Normal trading
        close = open + (Math.random() - 0.5) * 0.5;
        high = Math.max(open, close) + Math.random() * 0.2;
        low = Math.min(open, close) - Math.random() * 0.2;
      }
      
      data.push({
        datetime: new Date(time).toISOString(),
        timestamp: time,
        open,
        high,
        low,
        close,
        volume: 100000 + Math.random() * 50000,
      });
    }
    
    return data;
  }, []);

  // Create a sample escalator pattern for display
  const patterns: Pattern[] = useMemo(() => [
    {
      id: 'demo-escalator-1',
      type: PatternType.ESCALATOR,
      startTime: new Date('2025-01-15T10:10:00'),
      endTime: new Date('2025-01-15T10:18:00'),
      highPrice: 104.3,
      lowPrice: 100,
      confidence: 0.85,
      hasReceivedFeedback: false,
      direction: ThrustDirection.BULLISH,
      strength: 'MODERATE',
      stepCount: 9,
      avgStepHeight: 0.5,
      consistency: 0.8,
    } as any,
  ], []);

  const startDate = new Date('2025-01-15T09:30:00');
  const endDate = new Date('2025-01-15T11:30:00');

  return (
    <Container>
      <Header>Pattern Detection Demo</Header>
      <Description>
        This demo showcases the pattern detection capabilities including escalator patterns,
        goldmine opportunities, and trailing stop mechanisms.
      </Description>
      
      <ChartWrapper>
        <InfiniteZoomChart
          symbol="DEMO"
          startDate={startDate}
          endDate={endDate}
          width={window.innerWidth - 80}
          height={600}
          patterns={patterns}
          onPatternSelect={(pattern) => {
            console.log('Pattern selected:', pattern);
          }}
        />
      </ChartWrapper>
      
      <PatternInfo>
        <h3>Detected Patterns:</h3>
        <ul>
          {patterns.map((pattern, index) => (
            <li key={index}>
              <strong>{pattern.type}</strong>
              {pattern.type === PatternType.ESCALATOR && 'direction' in pattern && (
                <span> - Direction: {pattern.direction}</span>
              )}
              {pattern.type === PatternType.GOLDMINE_CHANNEL && 'profitAmount' in pattern && (
                <span> - Profit: ${typeof pattern.profitAmount === 'number' ? pattern.profitAmount.toFixed(2) : '0.00'}</span>
              )}
            </li>
          ))}
        </ul>
      </PatternInfo>
    </Container>
  );
};

export default PatternDemo;
