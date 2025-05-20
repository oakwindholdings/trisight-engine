import * as d3Scale from 'd3-scale';
import * as d3Array from 'd3-array';
import { isDuringTradingHours } from './marketHours';

/**
 * Creates a continuous time scale that skips non-trading hours entirely
 */
export function createContinuousTimeScale(
  canvasWidth: number,
  data: { timestamp: number }[],
  pixelRange: [number, number] = [0, canvasWidth]
) {
  // If there's no data, return a default scale
  if (data.length === 0) {
    return d3Scale.scaleTime()
      .domain([new Date(), new Date()])
      .range(pixelRange);
  }

  // Group data by trading day
  const tradingDays: Date[] = [];
  const tradingMinutes: Array<{ date: Date, minuteOfDay: number }> = [];
  
  // Identify all trading days and their trading minutes
  data.forEach(item => {
    const date = new Date(item.timestamp);
    
    // Skip if not during trading hours
    if (!isDuringTradingHours(date)) return;
    
    // Extract date without time component for grouping
    const dateKey = new Date(date);
    dateKey.setHours(0, 0, 0, 0);
    
    // Calculate minute of day
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const minuteOfDay = hours * 60 + minutes;
    
    // Add to the list of trading days if not already included
    if (!tradingDays.some(d => d.getTime() === dateKey.getTime())) {
      tradingDays.push(dateKey);
    }
    
    tradingMinutes.push({ date: date, minuteOfDay });
  });
  
  // Sort the trading days
  tradingDays.sort((a, b) => a.getTime() - b.getTime());
  
  // Create a continuous domain mapping
  const domain: Date[] = [];
  let currentMinute = 0;
  
  // For each trading day, add the trading hours to the domain
  tradingDays.forEach((day, dayIndex) => {
    // Start and end times for trading (9:30 AM to 4:00 PM)
    const startHour = 9;
    const startMinute = 30;
    const endHour = 16;
    const endMinute = 0;
    
    // Create start and end dates for this trading day
    const start = new Date(day);
    start.setHours(startHour, startMinute, 0, 0);
    
    const end = new Date(day);
    end.setHours(endHour, endMinute, 0, 0);
    
    domain.push(start);
    domain.push(end);
  });
  
  // Create the scale
  const scale = d3Scale.scaleTime()
    .domain(domain)
    .range(pixelRange);
  
  return scale;
}
