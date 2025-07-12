// src/components/SymbolTabs.tsx
// Bottom-aligned tab selector for switching between symbol sets
// Renders fixed tabs for Top-40, Core-40, Index-40, and TriSight-500

import React from 'react';
import { useSymbolSet } from '../contexts/SymbolSetContext';

const SymbolTabs: React.FC = () => {
  const { currentSet, availableSets, loading, error, loadSymbolSet, clearError } = useSymbolSet();

  const handleTabClick = async (setId: string) => {
    if (loading || currentSet === setId) return;
    await loadSymbolSet(setId);
  };

  return (
    <>
      {/* Error notification */}
      {error && (
        <div style={styles.errorContainer}>
          <span style={styles.errorText}>{error}</span>
          <button 
            style={styles.errorDismiss}
            onClick={clearError}
            aria-label="Dismiss error"
          >
            ×
          </button>
        </div>
      )}

      {/* Tab bar */}
      <div style={styles.container}>
        <div style={styles.tabBar}>
          {availableSets.map((set) => {
            const isActive = currentSet === set.id;
            const symbolCount = set.symbols.length;
            
            return (
              <button
                key={set.id}
                style={{
                  ...styles.tab,
                  ...(isActive ? styles.activeTab : {}),
                  ...(loading ? styles.disabledTab : {})
                }}
                onClick={() => handleTabClick(set.id)}
                disabled={loading}
                title={set.description}
              >
                <span style={styles.tabName}>{set.name}</span>
                <span style={styles.symbolCount}>
                  {loading && currentSet === set.id ? (
                    <span style={styles.loadingText}>Loading...</span>
                  ) : (
                    `${symbolCount} symbols`
                  )}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'fixed',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTop: '1px solid #e5e7eb',
    boxShadow: '0 -2px 4px rgba(0, 0, 0, 0.05)',
    zIndex: 1000,
  },
  tabBar: {
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '8px 16px',
    gap: '8px',
  },
  tab: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '12px 24px',
    backgroundColor: '#f9fafb',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    minWidth: '140px',
    outline: 'none',
  },
  activeTab: {
    backgroundColor: '#fef3c7',
    borderColor: '#fbbf24',
    boxShadow: '0 0 0 3px rgba(251, 191, 36, 0.1)',
  },
  disabledTab: {
    opacity: 0.6,
    cursor: 'not-allowed',
  },
  tabName: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '4px',
  },
  symbolCount: {
    fontSize: '12px',
    color: '#6b7280',
    fontWeight: '400',
  },
  loadingText: {
    color: '#3b82f6',
    fontStyle: 'italic',
  },
  errorContainer: {
    position: 'fixed',
    bottom: '72px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#fee2e2',
    border: '1px solid #fecaca',
    borderRadius: '8px',
    padding: '12px 16px',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    zIndex: 1001,
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
  },
  errorText: {
    color: '#dc2626',
    fontSize: '14px',
    fontWeight: '500',
  },
  errorDismiss: {
    background: 'none',
    border: 'none',
    color: '#dc2626',
    fontSize: '20px',
    cursor: 'pointer',
    padding: '0 4px',
    lineHeight: '1',
  },
};

export default SymbolTabs;
