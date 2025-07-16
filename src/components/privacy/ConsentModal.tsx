// src/components/privacy/ConsentModal.tsx
// Modal for requesting user consent for data collection
// Explains data usage and provides granular control options

import React, { useState } from 'react';
import './ConsentModal.css';

interface ConsentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConsentModal: React.FC<ConsentModalProps> = ({ isOpen, onClose }) => {
  const [allowDataProcessing, setAllowDataProcessing] = useState(true);
  const [allowModelTraining, setAllowModelTraining] = useState(true);
  const [allowAggregateSharing, setAllowAggregateSharing] = useState(true);
  
  if (!isOpen) return null;
  
  const handleAccept = () => {
    // Call the consent handler exposed by the hook
    if ((window as any).__handleConsentDecision) {
      (window as any).__handleConsentDecision(true, {
        consentType: 'feedback',
        allowDataProcessing,
        allowModelTraining,
        allowAggregateSharing
      });
    }
    onClose();
  };
  
  const handleDecline = () => {
    if ((window as any).__handleConsentDecision) {
      (window as any).__handleConsentDecision(false);
    }
    onClose();
  };
  
  return (
    <div className="consent-modal-overlay" onClick={(e) => e.stopPropagation()}>
      <div className="consent-modal">
        <div className="consent-header">
          <h2>Help Improve Pattern Detection</h2>
          <p className="consent-subtitle">
            Your feedback helps us make pattern detection more accurate
          </p>
        </div>
        
        <div className="consent-body">
          <div className="consent-section">
            <h3>How We Use Your Feedback</h3>
            <ul>
              <li>
                <strong>Pattern Accuracy:</strong> Your ratings help us understand which patterns are most reliable
              </li>
              <li>
                <strong>Timing Improvements:</strong> Your timing assessments help us detect patterns earlier
              </li>
              <li>
                <strong>False Positive Reduction:</strong> Your validity checks help us reduce incorrect detections
              </li>
            </ul>
          </div>
          
          <div className="consent-section">
            <h3>Your Privacy</h3>
            <ul>
              <li>All feedback is <strong>anonymous</strong> - we don't collect personal information</li>
              <li>Data is retained for <strong>90 days</strong> then automatically deleted</li>
              <li>You can revoke consent at any time from settings</li>
              <li>We use industry-standard encryption to protect your data</li>
            </ul>
          </div>
          
          <div className="consent-options">
            <h3>Data Usage Preferences</h3>
            
            <label className="consent-option">
              <input
                type="checkbox"
                checked={allowDataProcessing}
                onChange={(e) => setAllowDataProcessing(e.target.checked)}
              />
              <div>
                <strong>Basic Processing</strong>
                <p>Process feedback to improve pattern detection accuracy</p>
              </div>
            </label>
            
            <label className="consent-option">
              <input
                type="checkbox"
                checked={allowModelTraining}
                onChange={(e) => setAllowModelTraining(e.target.checked)}
              />
              <div>
                <strong>Model Training</strong>
                <p>Use feedback to train and improve detection algorithms</p>
              </div>
            </label>
            
            <label className="consent-option">
              <input
                type="checkbox"
                checked={allowAggregateSharing}
                onChange={(e) => setAllowAggregateSharing(e.target.checked)}
              />
              <div>
                <strong>Aggregate Insights</strong>
                <p>Share anonymized aggregate statistics with the community</p>
              </div>
            </label>
          </div>
          
          <div className="consent-notice">
            <p>
              By clicking "Accept", you agree to our feedback collection practices. 
              This consent is valid for 1 year and can be revoked anytime.
            </p>
          </div>
        </div>
        
        <div className="consent-actions">
          <button 
            className="consent-decline"
            onClick={handleDecline}
          >
            No Thanks
          </button>
          <button 
            className="consent-accept"
            onClick={handleAccept}
            disabled={!allowDataProcessing} // At least basic processing must be allowed
          >
            Accept & Continue
          </button>
        </div>
      </div>
    </div>
  );
}; 