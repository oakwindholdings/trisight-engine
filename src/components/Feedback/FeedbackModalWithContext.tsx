// src/components/Feedback/FeedbackModalWithContext.tsx
// Feedback modal wired to context
// Submits feedback then closes
import React from 'react';
import FeedbackModal from './FeedbackModal';
import { useFeedbackContext } from '../../contexts/FeedbackContext';
import { PatternFeedback } from '../../models/FeedbackTypes';
import { Pattern } from '../../models/PatternTypes';

interface FeedbackModalWithContextProps {
  pattern: Pattern;
  onClose: () => void;
  userId: string;
}

const FeedbackModalWithContext: React.FC<FeedbackModalWithContextProps> = ({
  pattern,
  onClose,
  userId
}) => {
  const { submitFeedback } = useFeedbackContext();

  const handleSubmit = async (feedback: PatternFeedback): Promise<void> => {
    await submitFeedback(feedback);
    onClose();
  };

  return (
    <FeedbackModal
      pattern={pattern}
      onSubmit={handleSubmit}
      onClose={onClose}
      userId={userId}
    />
  );
};

export default FeedbackModalWithContext;
