import { fetchCandlestickData } from '../../src/api/twelveDataApi';

describe('Data Fetcher Integration', () => {
  test('fetches data', async () => {
    const data = await fetchCandlestickData('AAPL', '1min', new Date('2023-01-01'), new Date());
    expect(data.length).toBeGreaterThan(0);
  });
}); 