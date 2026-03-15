import { jest } from '@jest/globals';

// Mock child_process before importing the module
const mockKill = jest.fn();
const mockOn = jest.fn();
const mockStdout = { on: jest.fn() };
const mockStderr = { on: jest.fn() };

jest.unstable_mockModule('child_process', () => ({
  spawn: jest.fn(() => ({
    kill: mockKill,
    on: mockOn,
    stdout: mockStdout,
    stderr: mockStderr,
  })),
}));

let createExtension;

beforeAll(async () => {
  const mod = await import('../dist/index.js');
  createExtension = mod.default;
});

describe('AGIFarmExtension', () => {
  const mockLogger = {
    info: jest.fn(),
    debug: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('createExtension returns an extension with correct metadata', () => {
    const ext = createExtension({});
    expect(ext.id).toBe('agi-farm');
    expect(ext.name).toBe('AGI Farm — Multi-Agent Team Builder');
    expect(typeof ext.version).toBe('string');
    expect(ext.version).toMatch(/^\d+\.\d+\.\d+/);
  });

  test('version matches package.json', async () => {
    const { createRequire } = await import('module');
    const require = createRequire(import.meta.url);
    const pkg = require('../package.json');
    const ext = createExtension({});
    expect(ext.version).toBe(pkg.version);
  });

  test('onLoad sets context and logs', async () => {
    const ext = createExtension({ autoStartPaperclip: false });
    const context = { logger: mockLogger, config: {} };
    await ext.onLoad(context);
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('[agi-farm] Plugin loaded'));
    expect(mockLogger.info).toHaveBeenCalledWith(expect.stringContaining('port='));
  });

  test('onUnload is safe when no Paperclip is running', async () => {
    const ext = createExtension({ autoStartPaperclip: false });
    await ext.onLoad({ logger: mockLogger, config: {} });
    await ext.onUnload();
  });

  test('isDashboardRunning returns false when not started', () => {
    const ext = createExtension({ autoStartPaperclip: false });
    expect(ext.isDashboardRunning()).toBe(false);
  });

  test('getDashboardUrl returns correct URL', () => {
    const ext = createExtension({ paperclipPort: 9090, paperclipHost: '0.0.0.0' });
    expect(ext.getDashboardUrl()).toBe('http://0.0.0.0:9090');
  });

  test('default config uses port 3100 and 127.0.0.1', () => {
    const ext = createExtension({});
    expect(ext.getDashboardUrl()).toBe('http://127.0.0.1:3100');
  });

  test('partial config merges with defaults', () => {
    const ext = createExtension({ paperclipPort: 3000 });
    expect(ext.getDashboardUrl()).toBe('http://127.0.0.1:3000');
  });
});
