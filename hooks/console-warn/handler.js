"use strict";
/**
 * Console Log Warning Hook Handler
 *
 * Scans edited files for console.log statements and warns if found
 * to prevent debug code from reaching production.
 *
 * Events: tool:result
 * Tools: Edit
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
exports.default = consoleWarnHook;
const fs = __importStar(require("fs/promises"));
async function consoleWarnHook(event) {
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
        // Read file content
        const content = await fs.readFile(filePath, 'utf-8');
        const lines = content.split('\n');
        // Find console.log statements (simple regex, not perfect but good enough)
        const consoleMatches = [];
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            // Skip comments
            if (line.trim().startsWith('//') || line.trim().startsWith('/*') || line.trim().startsWith('*')) {
                continue;
            }
            // Check for console.log (not in strings)
            // Simple check: look for console.log not inside quotes
            if (line.includes('console.log')) {
                // Basic heuristic: if it's not inside a comment or string literal
                // This is not perfect but catches most cases
                const beforeLog = line.split('console.log')[0];
                const singleQuotes = (beforeLog.match(/'/g) || []).length;
                const doubleQuotes = (beforeLog.match(/"/g) || []).length;
                const backTicks = (beforeLog.match(/`/g) || []).length;
                // If even number of quotes before console.log, it's likely real code
                if (singleQuotes % 2 === 0 && doubleQuotes % 2 === 0 && backTicks % 2 === 0) {
                    consoleMatches.push({
                        line: i + 1, // 1-indexed
                        content: line.trim()
                    });
                }
            }
        }
        // Generate warning or success message
        if (consoleMatches.length > 0) {
            const matchList = consoleMatches
                .map(m => `- Line ${m.line}: \`${m.content.substring(0, 80)}${m.content.length > 80 ? '...' : ''}\``)
                .join('\n');
            const warning = `

## ⚠️ Console.log Statements Found

Found ${consoleMatches.length} console.log statement${consoleMatches.length > 1 ? 's' : ''} in ${filePath}:

${matchList}

**Action Required:** Remove console.log statements before marking complete.

### Use Proper Logging Instead:

\`\`\`typescript
// Development debugging
logger.debug('User authenticated:', user);

// Production logging
logger.info('User login successful', { userId: user.id });
logger.error('Authentication failed', { error });
\`\`\`

### When Console.log is Intentional:

If console.log is required (e.g., CLI tool output), document it:
\`\`\`typescript
// Intentional: CLI tool output
console.log(result);
\`\`\`
`;
            return result + warning;
        }
        else {
            const success = `

## ✅ No Console.log Statements

File is clean - no console.log statements found.
`;
            return result + success;
        }
    }
    catch (error) {
        // If we can't read the file, skip silently
        return result;
    }
}
