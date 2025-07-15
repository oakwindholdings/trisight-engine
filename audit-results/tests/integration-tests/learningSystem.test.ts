import { LearningProcessor } from '../../src/utils/learning/LearningProcessor';
import { PatternType } from '../../src/models/PatternTypes';

describe('Learning Integration', () => {
  test('processes feedback', () => {
    const processor = new LearningProcessor();
    const mockFeedback = { patternId: '1', originalPatternType: PatternType.ESCALATOR, confidenceRating: 4, falsePositive: false, notes: '', submittedAt: new Date(), userId: 'test' };
    const result = processor.processFeedback(mockFeedback);
    expect(result.impactScore).toBeGreaterThan(0);
  });
}); 