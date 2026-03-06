"use strict";
/**
 * TypeScript Check Hook Handler
 *
 * Auto-runs TypeScript type checking after editing .ts/.tsx files
 * and appends results to provide immediate feedback on type errors.
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
exports.default = typecheckHook;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
async function typecheckHook(event) {
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
    }
    catch (error) {
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
