import { detectEscalators } from '../../src/patternEngine/escalator';

describe('Pattern Integration', () => {
  test('detects escalator', () => {
    const candles = [];
    expect(detectEscalators(candles)).toHaveLength(0);
  });
}); 