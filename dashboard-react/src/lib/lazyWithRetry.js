import { lazy } from 'react';

const RETRY_KEY = 'agi-farm-lazy-retry';

export function lazyWithRetry(importer) {
  return lazy(async () => {
    try {
      const mod = await importer();
      sessionStorage.removeItem(RETRY_KEY);
      return mod;
    } catch (err) {
      const hasRetried = sessionStorage.getItem(RETRY_KEY) === '1';
      if (!hasRetried) {
        sessionStorage.setItem(RETRY_KEY, '1');
        window.location.reload();
      }
      throw err;
    }
  });
}
