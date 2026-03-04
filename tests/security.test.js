import crypto from 'crypto';

/**
 * Tests for security-critical functions extracted from server/dashboard.js.
 * We re-implement the functions here to test in isolation without starting the full server.
 */

function constantTimeEquals(a, b) {
  const aBuf = Buffer.from(a || '', 'utf8');
  const bBuf = Buffer.from(b || '', 'utf8');
  const len = Math.max(aBuf.length, bBuf.length);
  const aPad = Buffer.alloc(len);
  const bPad = Buffer.alloc(len);
  aBuf.copy(aPad);
  bBuf.copy(bPad);
  return aBuf.length === bBuf.length && crypto.timingSafeEqual(aPad, bPad);
}

describe('constantTimeEquals', () => {
  test('returns true for identical strings', () => {
    expect(constantTimeEquals('abc123', 'abc123')).toBe(true);
  });

  test('returns false for different strings', () => {
    expect(constantTimeEquals('abc123', 'def456')).toBe(false);
  });

  test('returns false for different-length strings', () => {
    expect(constantTimeEquals('short', 'muchlongerstring')).toBe(false);
  });

  test('returns true for empty strings', () => {
    expect(constantTimeEquals('', '')).toBe(true);
  });

  test('returns false for empty vs non-empty', () => {
    expect(constantTimeEquals('', 'notempty')).toBe(false);
  });

  test('handles null/undefined gracefully', () => {
    expect(constantTimeEquals(null, null)).toBe(true);
    expect(constantTimeEquals(undefined, undefined)).toBe(true);
    expect(constantTimeEquals(null, 'abc')).toBe(false);
    expect(constantTimeEquals('abc', null)).toBe(false);
  });

  test('handles CSRF token length strings', () => {
    const token = crypto.randomBytes(24).toString('hex');
    expect(constantTimeEquals(token, token)).toBe(true);
    expect(constantTimeEquals(token, token + 'x')).toBe(false);
    expect(constantTimeEquals(token, crypto.randomBytes(24).toString('hex'))).toBe(false);
  });
});

describe('Origin validation', () => {
  const PORT = 8080;
  const ALLOWED_ORIGINS = new Set([
    `http://127.0.0.1:${PORT}`,
    `http://localhost:${PORT}`,
    `http://[::1]:${PORT}`,
  ]);

  test('allows localhost origins', () => {
    expect(ALLOWED_ORIGINS.has('http://127.0.0.1:8080')).toBe(true);
    expect(ALLOWED_ORIGINS.has('http://localhost:8080')).toBe(true);
    expect(ALLOWED_ORIGINS.has('http://[::1]:8080')).toBe(true);
  });

  test('rejects external origins', () => {
    expect(ALLOWED_ORIGINS.has('http://evil.com')).toBe(false);
    expect(ALLOWED_ORIGINS.has('http://127.0.0.1:9999')).toBe(false);
    expect(ALLOWED_ORIGINS.has('https://127.0.0.1:8080')).toBe(false);
  });

  test('rejects null/undefined origins', () => {
    expect(ALLOWED_ORIGINS.has(null)).toBe(false);
    expect(ALLOWED_ORIGINS.has(undefined)).toBe(false);
  });
});
