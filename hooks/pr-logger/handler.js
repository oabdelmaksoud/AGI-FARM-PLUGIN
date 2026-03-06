"use strict";
/**
 * PR Logger Hook Handler
 *
 * Detects PR creation and logs URL with helpful next steps.
 *
 * Events: tool:result
 * Tools: Bash
 */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = prLoggerHook;
const fs = __importStar(require("fs/promises"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
/**
 * Extract PR URL from gh pr create output
 */
function extractPRUrl(output) {
    // Match GitHub PR URLs
    const urlMatch = output.match(/https:\/\/github\.com\/[^\/]+\/[^\/]+\/pull\/\d+/);
    return urlMatch ? urlMatch[0] : null;
}
/**
 * Extract PR number from URL
 */
function extractPRNumber(url) {
    const match = url.match(/\/pull\/(\d+)/);
    return match ? match[1] : null;
}
/**
 * Log PR to file
 */
async function logPR(url) {
    const logsDir = path.join(os.homedir(), '.openclaw', 'logs');
    const logFile = path.join(logsDir, 'prs.log');
    // Ensure logs directory exists
    await fs.mkdir(logsDir, { recursive: true });
    // Create log entry
    const entry = {
        timestamp: new Date().toISOString(),
        url,
    };
    // Append to log file
    await fs.appendFile(logFile, JSON.stringify(entry) + '\n', 'utf-8');
}
async function prLoggerHook(event) {
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
    }
    catch (error) {
        // If logging fails, don't block - just return original result
        return result;
    }
}
