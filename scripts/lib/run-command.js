import { spawnSync } from 'child_process';

/**
 * Safe command runner with timeout.
 * @param {string} cmd - Command to run.
 * @param {string[]} args - Arguments.
 * @param {object} options - Extra spawnSync options.
 * @returns {import('child_process').SpawnSyncReturns<string>}
 */
export function runCommand(cmd, args, options = {}) {
  return spawnSync(cmd, args, {
    encoding: 'utf-8',
    timeout: 30000,
    ...options,
  });
}
