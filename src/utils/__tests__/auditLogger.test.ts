import { logAuditEvent } from '../auditLogger';

describe('Audit Logger', () => {
  test('logs event correctly', () => {
    const consoleSpy = jest.spyOn(console, 'log');
    logAuditEvent('test', { detail: 'info' });
    expect(consoleSpy).toHaveBeenCalled();
  });
}); 