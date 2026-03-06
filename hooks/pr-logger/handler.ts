/**
 * PR Logger Hook Handler
 *
 * Detects PR creation and logs URL with helpful next steps.
 *
 * Events: tool:result
 * Tools: Bash
 */

import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';

interface ToolEvent {
  tool: {
    name: string;
    params?: {
      command?: string;
      [key: string]: any;
    };
  };
  result: string;
}

interface PRLogEntry {
  timestamp: string;
  url: string;
  title?: string;
  sessionKey?: string;
}

/**
 * Extract PR URL from gh pr create output
 */
function extractPRUrl(output: string): string | null {
  // Match GitHub PR URLs
  const urlMatch = output.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/);
  return urlMatch ? urlMatch[0] : null;
}

/**
 * Extract PR number from URL
 */
function extractPRNumber(url: string): string | null {
  const match = url.match(/\/pull\/(\d+)/);
  return match ? match[1] : null;
}

/**
 * Log PR to file
 */
async function logPR(url: string): Promise<void> {
  const logsDir = path.join(os.homedir(), '.openclaw', 'logs');
  const logFile = path.join(logsDir, 'prs.log');

  // Ensure logs directory exists
  await fs.mkdir(logsDir, { recursive: true });

  // Create log entry
  const entry: PRLogEntry = {
    timestamp: new Date().toISOString(),
    url,
  };

  // Append to log file
  await fs.appendFile(logFile, JSON.stringify(entry) + '\n', 'utf-8');
}

export default async function prLoggerHook(event: ToolEvent): Promise<string> {
  const { tool, result } = event;

  // Only process Bash tool
  if (tool.name !== 'Bash') {
    return result;
  }

  // Check if command was gh pr create
  const command = tool.params?.command || '';
  if (!command.includes('gh pr create')) {
    return result; // Not a PR creation command
  }

  // Check if result contains PR URL
  const prUrl = extractPRUrl(result);
  if (!prUrl) {
    return result; // No PR URL found (command may have failed)
  }

  try {
    // Log PR to file
    await logPR(prUrl);

    // Extract PR number for convenience
    const prNumber = extractPRNumber(prUrl);

    // Append helpful information
    const prInfo = `

## 🔗 Pull Request Created

**PR URL:** ${prUrl}

PR has been logged to: \`~/.openclaw/logs/prs.log\`

### Next Steps:

1. **Review PR:**
   \`\`\`bash
   gh pr view ${prNumber} --web
   \`\`\`

2. **Request review:**
   \`\`\`bash
   gh pr review ${prNumber} --comment
   \`\`\`

3. **Check CI status:**
   \`\`\`bash
   gh pr checks ${prNumber}
   \`\`\`

4. **Merge when ready:**
   \`\`\`bash
   gh pr merge ${prNumber} --squash
   \`\`\`

### Alternative: Auto-merge after CI passes

\`\`\`bash
gh pr merge ${prNumber} --auto --squash
\`\`\`
`;

    return result + prInfo;

  } catch (error: any) {
    // If logging fails, don't block - just return original result
    return result;
  }
}
