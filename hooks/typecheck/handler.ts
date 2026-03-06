/**
 * TypeScript Check Hook Handler
 *
 * Auto-runs TypeScript type checking after editing .ts/.tsx files
 * and appends results to provide immediate feedback on type errors.
 *
 * Events: tool:result
 * Tools: Edit
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';

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

export default async function typecheckHook(event: ToolEvent): Promise<string> {
  const { tool, result } = event;

  // Only process Edit tool
  if (tool.name !== 'Edit') {
    return result;
  }

  // Check if file is TypeScript (.ts or .tsx)
  const filePath = tool.params?.file_path;
  if (!filePath || !filePath.match(/\.tsx?$/)) {
    return result; // Not a TypeScript file
  }

  try {
    // Get working directory from file path
    const cwd = path.dirname(filePath);

    // Run TypeScript check
    const { stdout, stderr } = await execAsync('npx tsc --noEmit 2>&1', {
      cwd,
      timeout: 10000, // 10 second timeout
      maxBuffer: 1024 * 1024, // 1MB buffer
    });

    const output = stdout || stderr || '';
    const hasErrors = output.trim().length > 0;

    // Format results
    const checkResults = `

## 🔍 TypeScript Check Results

\`\`\`bash
$ npx tsc --noEmit
${output.trim() || '(no output - types are valid)'}
\`\`\`

**Status:** ${hasErrors ? '❌ FAILED' : '✅ PASSED'} ${hasErrors ? `(errors found)` : '(0 errors)'}

${hasErrors ? '⚠️ Fix type errors before marking complete.' : ''}
`;

    return result + checkResults;

  } catch (error: any) {
    // TypeScript check failed (either command not found or type errors)
    const output = error.stdout || error.stderr || error.message || '';

    // If TypeScript is not installed, skip silently
    if (output.includes('tsc: command not found') ||
        output.includes('npx: command not found') ||
        output.includes('ENOENT')) {
      return result; // TypeScript not available, skip
    }

    // Type errors found (tsc exits with code 2)
    const checkResults = `

## 🔍 TypeScript Check Results

\`\`\`bash
$ npx tsc --noEmit
${output.trim()}
\`\`\`

**Status:** ❌ FAILED (type errors found)

⚠️ Fix type errors before marking complete.
`;

    return result + checkResults;
  }
}
