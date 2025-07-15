// src/components/Feedback/FeedbackModalWithContext.tsx
// Feedback modal bound to context
// Submits feedback then closes modal
import React from 'react';
import { FeedbackModal } from './FeedbackModal';
import { useFeedbackContext } from '../../contexts/FeedbackContext';
import { Pattern } from '../../models/PatternTypes';
import { PatternFeedback } from '../../models/FeedbackTypes';

interface FeedbackModalWithContextProps {
  pattern: Pattern;
  onClose: () => void;
  userId: string;
}

const FeedbackModalWithContext: React.FC<FeedbackModalWithContextProps> = ({ pattern, onClose, userId }) => {
  const { submitFeedback } = useFeedbackContext();

  const handleSubmit = async (feedback: PatternFeedback): Promise<void> => {
    await submitFeedback(feedback);
    onClose();
  };

  return (
    <FeedbackModal pattern={pattern} onSubmit={handleSubmit} onClose={onClose} userId={userId} />
  );
};

export default FeedbackModalWithContext;
