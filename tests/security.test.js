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

// ── ID Validation Tests ──────────────────────────────────────────────────────

const ID_PATTERN = /^[a-zA-Z0-9_-]{1,128}$/;

function isSafeId(id) {
  return typeof id === 'string' && ID_PATTERN.test(id);
}

describe('isSafeId', () => {
  test('accepts valid agent IDs', () => {
    expect(isSafeId('main')).toBe(true);
    expect(isSafeId('researcher')).toBe(true);
    expect(isSafeId('qa-engineer')).toBe(true);
    expect(isSafeId('agent_01')).toBe(true);
    expect(isSafeId('A-Z_0-9')).toBe(true);
  });

  test('rejects path traversal attempts', () => {
    expect(isSafeId('../etc/passwd')).toBe(false);
    expect(isSafeId('..%2F..%2Fetc')).toBe(false);
    expect(isSafeId('foo/bar')).toBe(false);
    expect(isSafeId('foo\\bar')).toBe(false);
  });

  test('rejects empty and oversized IDs', () => {
    expect(isSafeId('')).toBe(false);
    expect(isSafeId('a'.repeat(129))).toBe(false);
  });

  test('rejects non-string inputs', () => {
    expect(isSafeId(null)).toBe(false);
    expect(isSafeId(undefined)).toBe(false);
    expect(isSafeId(123)).toBe(false);
    expect(isSafeId({})).toBe(false);
  });

  test('rejects IDs with special characters', () => {
    expect(isSafeId('agent;rm -rf')).toBe(false);
    expect(isSafeId('agent$(cmd)')).toBe(false);
    expect(isSafeId('agent`cmd`')).toBe(false);
    expect(isSafeId('agent name')).toBe(false);
  });
});

// ── Note Sanitization Tests ──────────────────────────────────────────────────

function sanitizeNote(note) {
  if (typeof note !== 'string') return '';
  let cleaned = note.slice(0, 1000).replace(/[\x00-\x1f\x7f]/g, '');
  if (cleaned.startsWith('-')) cleaned = ' ' + cleaned;
  return cleaned;
}

describe('sanitizeNote', () => {
  test('returns clean string unchanged', () => {
    expect(sanitizeNote('This is a normal note')).toBe('This is a normal note');
  });

  test('truncates to 1000 characters', () => {
    const long = 'x'.repeat(1500);
    expect(sanitizeNote(long).length).toBe(1000);
  });

  test('strips control characters', () => {
    expect(sanitizeNote('hello\x00world')).toBe('helloworld');
    expect(sanitizeNote('test\x1b[31mred')).toBe('test[31mred');
    expect(sanitizeNote('line\x7fend')).toBe('lineend');
  });

  test('prevents CLI flag injection by prepending space', () => {
    expect(sanitizeNote('--malicious-flag')).toBe(' --malicious-flag');
    expect(sanitizeNote('-x')).toBe(' -x');
    expect(sanitizeNote('---')).toBe(' ---');
  });

  test('does not alter notes that do not start with hyphen', () => {
    expect(sanitizeNote('normal note with --flag inside')).toBe('normal note with --flag inside');
  });

  test('handles non-string inputs', () => {
    expect(sanitizeNote(null)).toBe('');
    expect(sanitizeNote(undefined)).toBe('');
    expect(sanitizeNote(123)).toBe('');
    expect(sanitizeNote({})).toBe('');
  });
});
