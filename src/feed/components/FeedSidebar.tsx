// path // FeedSidebar.tsx // Left-hand rail feed UI.

import React from 'react';
import styled from 'styled-components';
import { usePatternFeed } from '../hooks/usePatternFeed';
import { useUserInterest } from '../../contexts/UserInterestContext';
import { usePatternContext } from '../../contexts/PatternContext';

// Utility – pick interesting metadata keys for quick view
function extractHighlights(meta: Record<string, any>): Array<[string, any]> {
  if (!meta) return [];
  const priority = [
    'goldenScore',
    'accelerationRate',
    'momentumScore',
    'retracementPercentage',
    'depthPercent',
    'breakoutStrength',
    'convictionRating',
    'confidenceLevel',
    'signalStrength',
  ];
  const out: Array<[string, any]> = [];
  priority.forEach((k) => {
    if (meta[k] != null) out.push([k, meta[k]]);
  });
  // Fallback: include up to 2 arbitrary keys if none matched
  if (out.length === 0) {
    Object.keys(meta)
      .slice(0, 2)
      .forEach((k) => out.push([k, meta[k]]));
  }
  return out;
}

const Sidebar = styled.aside`
  position: fixed;
  left: 0;
  top: 60px; /* header height */
  bottom: 0;
  width: 300px;
  overflow-y: auto;
  background: #fafafa;
  border-right: 1px solid #e0e0e0;
  z-index: 30;
`;

const Card = styled.div`
  padding: 10px 14px;
  border-bottom: 1px solid #e5e5e5;
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

interface FeedCardProps {
  entry: any;
}

const FeedCard: React.FC<FeedCardProps> = ({ entry }) => {
  const patternCtx = usePatternContext();
  const highlights = extractHighlights(entry.metadata || {});

  const handleAnalyze = () => {
    console.log('[FeedCard] handleAnalyze called for:', entry);
    console.log('[FeedCard] patternCtx:', patternCtx);
    console.log('[FeedCard] patternCtx.patterns:', patternCtx.patterns);
    const patterns = patternCtx.patterns || [];
    console.log('[FeedCard] Available patterns:', patterns.length);
    
    // Log first few patterns to see their structure
    if (patterns.length > 0) {
      console.log('[FeedCard] Sample pattern:', patterns[0]);
      console.log('[FeedCard] Pattern symbols:', patterns.slice(0, 3).map((p: any) => ({
        type: p.type,
        symbol: p.symbol,
        ticker: p.ticker,
        id: p.id
      })));
      console.log('[FeedCard] All pattern types:', Array.from(new Set(patterns.map((p: any) => p.type))));
      console.log('[FeedCard] ESCALATOR patterns:', patterns.filter((p: any) => p.type === 'ESCALATOR').length);
    }

    // Primary match by id if feed metadata carried it
    let target = patterns.find((p: any) => p.id && p.id === entry.metadata?.id);
    console.log('[FeedCard] Pattern found by id?', !!target);
    console.log('[FeedCard] Looking for:', {
      entryType: entry.patternType,
      entrySymbol: entry.symbol,
      entryId: entry.metadata?.id
    });

    // Secondary: match by type + symbol, then nearest timestamp
    if (!target) {
      console.log('[FeedCard] Comparing pattern types:', {
        lookingFor: entry.patternType,
        lookingForType: typeof entry.patternType,
        samplePatternType: patterns[0]?.type,
        samplePatternTypeOf: typeof patterns[0]?.type,
        exactMatch: patterns[0]?.type === entry.patternType
      });
      
      const sameTypeAndSymbol = patterns.filter(
        (p: any) =>
          p.type === entry.patternType &&
          ((p.symbol || p.ticker || '').toUpperCase() === entry.symbol.toUpperCase())
      );
      console.log('[FeedCard] Patterns matching type+symbol:', sameTypeAndSymbol.length);
      if (sameTypeAndSymbol.length > 0) {
        console.log('[FeedCard] Matching patterns:', sameTypeAndSymbol.map((p: any) => ({
          id: p.id,
          type: p.type,
          symbol: p.symbol,
          startTime: p.startTime,
          endTime: p.endTime
        })));
      }
      
      if (sameTypeAndSymbol.length) {
        const ts = new Date(entry.timestamp).getTime();
        target = sameTypeAndSymbol.reduce((best: any, p: any) => {
          const diff = Math.abs((p.endTime as any)?.getTime?.() || 0 - ts);
          if (!best) return p;
          const bestDiff = Math.abs((best.endTime as any)?.getTime?.() || 0 - ts);
          return diff < bestDiff ? p : best;
        }, null);
        console.log('[FeedCard] Selected target after timestamp match:', target);
      }
    }

    if (target) {
      console.log('[FeedCard] Target pattern found:', target);
      // Patch confidence if missing
      if (target && (target as any).confidence == null && entry.confidence != null) {
        (target as any).confidence = entry.confidence;
      }
      console.log('[FeedCard] Calling setSelectedPattern...');
      patternCtx.setSelectedPattern?.(target);
      patternCtx.setSelectedPatternForFeedback?.(target);

      // Emit custom event for chart zoom (listener inside chart component)
      console.log('[FeedCard] Dispatching zoom event with patternId:', target.id);
      window.dispatchEvent(
        new CustomEvent('trisight-zoom-to-pattern', { detail: { patternId: target.id } })
      );
    } else {
      // Create a synthetic pattern from the feed entry metadata
      console.log('[FeedCard] Creating synthetic pattern from feed entry');
      
      if (entry.metadata && entry.patternType === 'ESCALATOR') {
        const syntheticPattern = {
          id: `synthetic_${entry.id}`,
          type: entry.patternType,
          startTime: entry.metadata.startTime ? new Date(entry.metadata.startTime) : new Date(entry.timestamp),
          endTime: entry.metadata.endTime ? new Date(entry.metadata.endTime) : new Date(entry.timestamp),
          highPrice: entry.metadata.highPrice || Math.max(...(entry.metadata.steps || []).map((s: any) => s.ceiling || 0)) || 100,
          lowPrice: entry.metadata.lowPrice || Math.min(...(entry.metadata.steps || []).map((s: any) => s.floor || 0)) || 90,
          confidence: entry.confidence || entry.metadata.consistency || 0.5,
          hasReceivedFeedback: false,
          direction: entry.metadata.direction,
          symbol: entry.symbol,
          ticker: entry.symbol,
          // Include escalator-specific data
          steps: entry.metadata.steps || [],
          startIndex: entry.metadata.startIndex,
          endIndex: entry.metadata.endIndex,
          averageStepHeight: entry.metadata.averageStepHeight,
          consistency: entry.metadata.consistency
        };
        
        console.log('[FeedCard] Setting synthetic pattern:', syntheticPattern);
        patternCtx.setSelectedPattern?.(syntheticPattern as any);
        patternCtx.setSelectedPatternForFeedback?.(syntheticPattern as any);
        
        // Try to zoom based on indices
        if (entry.metadata.startIndex != null && entry.metadata.endIndex != null) {
          window.dispatchEvent(
            new CustomEvent('trisight-zoom-to-indices', { 
              detail: { 
                startIndex: entry.metadata.startIndex,
                endIndex: entry.metadata.endIndex
              } 
            })
          );
        }
      } else {
        console.warn('[FeedCard] Cannot create synthetic pattern - missing metadata');
      }
    }
  };
  return (
    <Card>
      <div style={{ fontWeight: 700 }}>{entry.patternType.replace(/_/g, ' ')}</div>
      <div style={{ fontSize: 13 }}>
        {entry.symbol} •{' '}
        {new Date(entry.timestamp).toLocaleString(undefined, {
          hour12: false,
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </div>
      {entry.confidence != null && entry.confidence !== 0 && (
        <div style={{ fontSize: 12, color: '#666' }}>
          Confidence: {(entry.confidence * 100).toFixed(1)}%
        </div>
      )}
      {/* highlight block */}
      {highlights.length > 0 && (
        <ul style={{ fontSize: 12, margin: '4px 0', paddingLeft: 16 }}>
          {highlights.map(([k, v]) => (
            <li key={k}>
              {k}: {typeof v === 'number' ? v.toFixed ? v.toFixed(2) : v : String(v)}
            </li>
          ))}
        </ul>
      )}
      {/* AI-introspectable full JSON */}
      <details style={{ marginTop: 4 }}>
        <summary style={{ cursor: 'pointer', fontSize: 11, color: '#888' }}>raw</summary>
        <pre style={{ fontSize: 10, whiteSpace: 'pre-wrap' }} data-json>{
          JSON.stringify(entry, null, 2)
        }</pre>
      </details>

      <button
        style={{ marginTop: 4, fontSize: 12, alignSelf: 'flex-start' }}
        onClick={handleAnalyze}
      >Analyze</button>
    </Card>
  );
};

export const FeedSidebar: React.FC = () => {
  const filters = useUserInterest();
  const feed = usePatternFeed(filters);

  return (
    <Sidebar>
      {feed.map((e) => (
        <FeedCard key={e.id} entry={e} />
      ))}
    </Sidebar>
  );
}; 