// src/hooks/usePrivacyConsent.ts
// Hook for managing user privacy consent for feedback collection
// Handles consent state, persistence, and UI triggers

import { useState, useEffect, useCallback } from 'react';
import { PrivacyConsent, createDefaultConsent } from '../models/FeedbackTypes';
import { logDebug } from '../utils/debug';

const CONSENT_STORAGE_KEY = 'trisight_privacy_consent';
const SESSION_ID_KEY = 'sessionId';

interface UsePrivacyConsentReturn {
  hasConsent: boolean;
  consent: PrivacyConsent | null;
  requestConsent: () => Promise<boolean>;
  revokeConsent: () => void;
  updateConsent: (updates: Partial<PrivacyConsent>) => void;
  showConsentModal: boolean;
  setShowConsentModal: (show: boolean) => void;
}

export function usePrivacyConsent(): UsePrivacyConsentReturn {
  const [consent, setConsent] = useState<PrivacyConsent | null>(null);
  const [showConsentModal, setShowConsentModal] = useState(false);
  const [consentResolver, setConsentResolver] = useState<((granted: boolean) => void) | null>(null);
  
  // Initialize session ID if not exists
  useEffect(() => {
    let sessionId = localStorage.getItem(SESSION_ID_KEY);
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem(SESSION_ID_KEY, sessionId);
    }
  }, []);
  
  // Load consent from storage on mount
  useEffect(() => {
    const loadConsent = () => {
      try {
        const stored = localStorage.getItem(CONSENT_STORAGE_KEY);
        if (stored) {
          const parsedConsent = JSON.parse(stored) as PrivacyConsent;
          
          // Check if consent is expired
          if (new Date(parsedConsent.expiresAt) > new Date()) {
            setConsent(parsedConsent);
            logDebug('privacy', 'Loaded valid consent from storage', parsedConsent);
          } else {
            // Expired consent, remove it
            localStorage.removeItem(CONSENT_STORAGE_KEY);
            logDebug('privacy', 'Removed expired consent');
          }
        }
      } catch (error) {
        logDebug('privacy', 'Error loading consent from storage:', error);
      }
    };
    
    loadConsent();
  }, []);
  
  // Save consent to storage whenever it changes
  useEffect(() => {
    if (consent) {
      try {
        localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(consent));
        logDebug('privacy', 'Saved consent to storage');
      } catch (error) {
        logDebug('privacy', 'Error saving consent to storage:', error);
      }
    }
  }, [consent]);
  
  const requestConsent = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      setConsentResolver(() => resolve);
      setShowConsentModal(true);
    });
  }, []);
  
  const handleConsentDecision = useCallback((granted: boolean, options?: Partial<PrivacyConsent>) => {
    const sessionId = localStorage.getItem(SESSION_ID_KEY) || 'anonymous';
    
    if (granted) {
      const newConsent: PrivacyConsent = {
        ...createDefaultConsent(sessionId),
        consentGiven: true,
        timestamp: new Date(),
        ...options
      };
      
      setConsent(newConsent);
      logDebug('privacy', 'Consent granted', newConsent);
    } else {
      setConsent(null);
      logDebug('privacy', 'Consent denied');
    }
    
    setShowConsentModal(false);
    
    if (consentResolver) {
      consentResolver(granted);
      setConsentResolver(null);
    }
  }, [consentResolver]);
  
  const revokeConsent = useCallback(() => {
    setConsent(null);
    localStorage.removeItem(CONSENT_STORAGE_KEY);
    logDebug('privacy', 'Consent revoked');
  }, []);
  
  const updateConsent = useCallback((updates: Partial<PrivacyConsent>) => {
    if (consent) {
      const updatedConsent = {
        ...consent,
        ...updates,
        timestamp: new Date()
      };
      setConsent(updatedConsent);
      logDebug('privacy', 'Consent updated', updates);
    }
  }, [consent]);
  
  // Expose consent decision handler for the modal
  useEffect(() => {
    (window as any).__handleConsentDecision = handleConsentDecision;
    return () => {
      delete (window as any).__handleConsentDecision;
    };
  }, [handleConsentDecision]);
  
  return {
    hasConsent: !!consent?.consentGiven,
    consent,
    requestConsent,
    revokeConsent,
    updateConsent,
    showConsentModal,
    setShowConsentModal
  };
} 