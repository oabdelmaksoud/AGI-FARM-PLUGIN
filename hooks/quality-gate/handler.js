"use strict";
/**
 * Quality Gate Hook Handler
 *
 * Appends quality check reminders after file edits to ensure agents
 * verify their work before marking tasks complete.
 *
 * Events: tool:result
 * Tools: Edit, Write, MultiEdit
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = qualityGateHook;
async function qualityGateHook(event) {
    const { tool, result } = event;
    // Only process Edit, Write, MultiEdit tools
    if (!['Edit', 'Write', 'MultiEdit'].includes(tool.name)) {
        return result; // Pass through unchanged
    }
    // Append quality check reminder
    const qualityChecks = `

## ✅ Quality Gates Required

Before marking this task complete, run verification:

\`\`\`bash
# Build Verification
npm run build 2>&1 | tail -20
# Exit code: 0 (success)

# Type Check
npx tsc --noEmit 2>&1 | head -30
# Zero type errors

# Test Suite
npm test -- --coverage 2>&1 | tail -50
# All tests pass, coverage >80%

# Lint Check
npm run lint 2>&1 | head -30
# Zero errors (warnings acceptable)

# Security Scan
grep -rn "console.log" src/ 2>/dev/null | head -5
# No console.log statements
grep -rn "sk-" --include="*.ts" --include="*.js" . 2>/dev/null | head -5
# No API keys
\`\`\`

### Completion Checklist

Include in your completion message:

\`\`\`
✅ Build: PASS
✅ Types: PASS (0 errors)
✅ Tests: PASS (15/15, 92% coverage)
✅ Lint: PASS
✅ Security: PASS
\`\`\`

**If ANY gate fails, task is NOT complete. Fix and re-verify.**
`;
    return result + qualityChecks;
}
