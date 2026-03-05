import { compareSemVer, UpdateChecker } from '../server/updater.js';

describe('compareSemVer', () => {
  test('equal versions return 0', () => {
    expect(compareSemVer('1.0.2', '1.0.2')).toBe(0);
  });

  test('newer major returns 1', () => {
    expect(compareSemVer('2.0.0', '1.9.9')).toBe(1);
  });

  test('older major returns -1', () => {
    expect(compareSemVer('1.0.0', '2.0.0')).toBe(-1);
  });

  test('newer minor returns 1', () => {
    expect(compareSemVer('1.1.0', '1.0.9')).toBe(1);
  });

  test('newer patch returns 1', () => {
    expect(compareSemVer('1.0.3', '1.0.2')).toBe(1);
  });

  test('older patch returns -1', () => {
    expect(compareSemVer('1.0.1', '1.0.2')).toBe(-1);
  });

  test('handles null/undefined input', () => {
    expect(compareSemVer(null, '1.0.0')).toBe(-1);
    expect(compareSemVer('1.0.0', null)).toBe(1);
    expect(compareSemVer(null, null)).toBe(0);
  });

  test('handles short version strings', () => {
    expect(compareSemVer('1.0', '1.0.0')).toBe(0);
    expect(compareSemVer('2', '1.9.9')).toBe(1);
  });
});

describe('UpdateChecker', () => {
  test('constructor reads current version from package.json', () => {
    const checker = new UpdateChecker();
    expect(checker.currentVersion).toBeDefined();
    expect(checker.currentVersion).toMatch(/^\d+\.\d+\.\d+$/);
  });

  test('getStatus returns expected shape before any check', () => {
    const checker = new UpdateChecker();
    const status = checker.getStatus();
    expect(status).toHaveProperty('updateAvailable', false);
    expect(status).toHaveProperty('currentVersion');
    expect(status).toHaveProperty('latestVersion', null);
    expect(status).toHaveProperty('releaseUrl', null);
    expect(status).toHaveProperty('releaseNotes', null);
    expect(status).toHaveProperty('publishedAt', null);
    expect(status).toHaveProperty('lastCheck', null);
  });

  test('getStatus returns serializable object', () => {
    const checker = new UpdateChecker();
    const status = checker.getStatus();
    const serialized = JSON.parse(JSON.stringify(status));
    expect(serialized).toEqual(status);
  });

  test('check handles network errors gracefully', async () => {
    const checker = new UpdateChecker();
    const originalFetch = global.fetch;
    global.fetch = async () => { throw new Error('Network error'); };
    try {
      const status = await checker.check();
      expect(status.updateAvailable).toBe(false);
      expect(status.latestVersion).toBeNull();
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('check detects update when remote version is newer', async () => {
    const checker = new UpdateChecker();
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        tag_name: 'v99.0.0',
        html_url: 'https://github.com/oabdelmaksoud/AGI-FARM-PLUGIN/releases/tag/v99.0.0',
        body: 'Test release notes',
        published_at: '2026-01-01T00:00:00Z',
      }),
    });
    try {
      const status = await checker.check();
      expect(status.updateAvailable).toBe(true);
      expect(status.latestVersion).toBe('99.0.0');
      expect(status.releaseUrl).toContain('github.com');
      expect(status.releaseNotes).toBe('Test release notes');
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('check reports no update when remote version is same', async () => {
    const checker = new UpdateChecker();
    const originalFetch = global.fetch;
    global.fetch = async () => ({
      ok: true,
      json: async () => ({
        tag_name: `v${checker.currentVersion}`,
        html_url: 'https://example.com',
        body: '',
        published_at: '2026-01-01T00:00:00Z',
      }),
    });
    try {
      const status = await checker.check();
      expect(status.updateAvailable).toBe(false);
      expect(status.latestVersion).toBe(checker.currentVersion);
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('check uses cache within CACHE_MS', async () => {
    const checker = new UpdateChecker();
    const originalFetch = global.fetch;
    let callCount = 0;
    global.fetch = async () => {
      callCount++;
      return {
        ok: true,
        json: async () => ({
          tag_name: 'v99.0.0',
          html_url: 'https://example.com',
          body: '',
          published_at: '2026-01-01T00:00:00Z',
        }),
      };
    };
    try {
      await checker.check();
      await checker.check();
      await checker.check();
      expect(callCount).toBe(1); // Only one actual fetch due to caching
    } finally {
      global.fetch = originalFetch;
    }
  });

  test('check handles non-ok response', async () => {
    const checker = new UpdateChecker();
    const originalFetch = global.fetch;
    global.fetch = async () => ({ ok: false, status: 403 });
    try {
      const status = await checker.check();
      expect(status.updateAvailable).toBe(false);
    } finally {
      global.fetch = originalFetch;
    }
  });
});
