import React from 'react';
import { Pattern } from '../../models/PatternTypes';
interface Props { pattern: Pattern; }
const GoldmineChannelPatternDetails: React.FC<Props> = ({ pattern }) => (
  <div>
    <h3>Goldmine Channel Details</h3>
    <p>Channel boundaries: {(pattern as any).high ?? 'N/A'} - {(pattern as any).low ?? 'N/A'}</p>
    {/* More */}
  </div>
);
export default GoldmineChannelPatternDetails; 