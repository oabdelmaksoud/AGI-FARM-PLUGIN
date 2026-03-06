/**
 * Auto-Format Hook Handler
 *
 * Auto-formats JS/TS files after edits using Biome or Prettier (auto-detected).
 *
 * Events: tool:result
 * Tools: Edit
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import * as fs from 'fs/promises';

const execAsync = promisify(exec);

interface ToolEvent {
  tool: {
    name: string;
    params?: {
      file_path?: string;
      [key: string]: any;
    };
  };
  result: string;
}

type Formatter = 'biome' | 'prettier' | 'none';

/**
 * Detect available formatter in project
 */
async function detectFormatter(cwd: string): Promise<Formatter> {
  try {
    // Check for Biome first (recommended)
    await execAsync('npx @biomejs/biome --version', { cwd, timeout: 5000 });
    return 'biome';
  } catch {
    try {
      // Fall back to Prettier
      await execAsync('npx prettier --version', { cwd, timeout: 5000 });
      return 'prettier';
    } catch {
      return 'none';
    }
  }
}

/**
 * Format file with detected formatter
 */
async function formatFile(filePath: string, formatter: Formatter): Promise<{ success: boolean; message: string }> {
  const cwd = path.dirname(filePath);
  const fileName = path.basename(filePath);

  try {
    if (formatter === 'biome') {
      await execAsync(`npx @biomejs/biome format --write "${fileName}"`, {
        cwd,
        timeout: 10000,
      });
      return { success: true, message: 'Formatted with Biome' };
    } else if (formatter === 'prettier') {
      await execAsync(`npx prettier --write "${fileName}"`, {
        cwd,
        timeout: 10000,
      });
      return { success: true, message: 'Formatted with Prettier' };
    } else {
      return { success: false, message: 'No formatter detected' };
    }
  } catch (error: any) {
    return { success: false, message: `Formatting failed: ${error.message}` };
  }
}

export default async function autoFormatHook(event: ToolEvent): Promise<string> {
  const { tool, result } = event;

  // Only process Edit tool
  if (tool.name !== 'Edit') {
    return result;
  }

  // Check if file is JavaScript/TypeScript
  const filePath = tool.params?.file_path;
  if (!filePath || !filePath.match(/\.(jsx?|tsx?)$/)) {
    return result; // Not a JS/TS file
  }

  try {
    // Get working directory
    const cwd = path.dirname(filePath);

    // Detect available formatter
    const formatter = await detectFormatter(cwd);

    if (formatter === 'none') {
      // No formatter available - skip silently (don't clutter output)
      return result;
    }

    // Format the file
    const formatResult = await formatFile(filePath, formatter);

    if (formatResult.success) {
      const formatterName = formatter === 'biome' ? 'Biome' : 'Prettier';
      const success = `

## 🎨 Auto-Format Results

**Formatter:** ${formatterName}
**File:** ${path.basename(filePath)}
**Status:** ✅ Formatted successfully

File has been auto-formatted and saved.
`;
      return result + success;
    } else {
      // Formatting failed - show warning but don't block
      const warning = `

## 🎨 Auto-Format Results

**Status:** ⚠️ ${formatResult.message}

File was not formatted. This is non-blocking.
`;
      return result + warning;
    }

  } catch (error: any) {
    // Any error - skip silently to avoid cluttering output
    return result;
  }
}
