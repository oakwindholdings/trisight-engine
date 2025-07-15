// src/components/Feedback/GoldmineChannelAdjuster.tsx
// Adjusts channel boundaries
// Specific to Goldmine pattern
import React from 'react';
interface GoldmineChannelAdjusterProps {
  originalUpper: number;
  originalLower: number;
  onChange: (upper: number, lower: number) => void;
}
export const GoldmineChannelAdjuster: React.FC<GoldmineChannelAdjusterProps> = ({ originalUpper, originalLower, onChange }) => {
  const [upper, setUpper] = React.useState(originalUpper);
  const [lower, setLower] = React.useState(originalLower);
  const handleUpperChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newUpper = parseFloat(e.target.value);
    setUpper(newUpper);
    onChange(newUpper, lower);
  };
  const handleLowerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLower = parseFloat(e.target.value);
    setLower(newLower);
    onChange(upper, newLower);
  };
  return (
    <div>
      <label>Upper: <input type='number' value={upper} onChange={handleUpperChange} /></label>
      <label>Lower: <input type='number' value={lower} onChange={handleLowerChange} /></label>
    </div>
  );
};
