import { runCommand } from '../scripts/lib/run-command.js';

describe('runCommand', () => {
  test('runs a simple command and returns result', () => {
    const result = runCommand('echo', ['hello']);
    expect(result.status).toBe(0);
    expect(result.stdout.trim()).toBe('hello');
  });

  test('returns non-zero status for failed commands', () => {
    const result = runCommand('false', []);
    expect(result.status).not.toBe(0);
  });

  test('respects timeout option', () => {
    const result = runCommand('sleep', ['0.01'], { timeout: 5000 });
    expect(result.status).toBe(0);
  });

  test('allows encoding override', () => {
    const result = runCommand('echo', ['test'], { encoding: 'utf-8' });
    expect(typeof result.stdout).toBe('string');
  });
});
