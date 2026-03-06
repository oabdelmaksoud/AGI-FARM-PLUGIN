"use strict";
/**
 * Build Analyzer Hook Handler
 *
 * Analyzes build output and provides intelligent suggestions for fixing
 * common build errors.
 *
 * Events: tool:result
 * Tools: Bash
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = buildAnalyzerHook;
/**
 * Check if command is a build command
 */
function isBuildCommand(command) {
    const buildPatterns = [
        /npm\s+(run\s+)?build/,
        /pnpm\s+build/,
        /yarn\s+build/,
        /go\s+build/,
        /cargo\s+build/,
        /python.*setup\.py.*build/,
        /tsc\s/,
        /webpack/,
        /vite\s+build/,
    ];
    return buildPatterns.some(pattern => pattern.test(command));
}
/**
 * Parse build output for errors
 */
function parseErrors(output) {
    const errors = [];
    const lines = output.split('\n');
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Module not found errors
        if (line.match(/Cannot find module|Module not found|No such file/i)) {
            const moduleMatch = line.match(/['"]([^'"]+)['"]/);
            const module = moduleMatch ? moduleMatch[1] : 'unknown';
            errors.push({
                type: 'module-not-found',
                message: line.trim(),
                suggestion: `Check if module exists or install missing dependency:\n\`\`\`bash\nnpm install ${module}\n\`\`\``
            });
        }
        // TypeScript type errors
        else if (line.match(/error TS\d+:/)) {
            const fileMatch = line.match(/([^(]+)\((\d+),\d+\)/);
            const file = fileMatch ? fileMatch[1] : undefined;
            const lineNum = fileMatch ? parseInt(fileMatch[2]) : undefined;
            errors.push({
                type: 'type-error',
                file,
                line: lineNum,
                message: line.trim(),
                suggestion: 'Fix type error by ensuring types match or adding proper type annotations.'
            });
        }
        // Syntax errors
        else if (line.match(/SyntaxError|Unexpected token|Unexpected end of input/i)) {
            errors.push({
                type: 'syntax-error',
                message: line.trim(),
                suggestion: 'Check syntax around the error location. Look for:\n- Missing or extra braces/brackets\n- Missing semicolons\n- Unclosed strings'
            });
        }
        // Dependency errors
        else if (line.match(/peer dep|UNMET DEPENDENCY|missing:|not found/i)) {
            errors.push({
                type: 'dependency',
                message: line.trim(),
                suggestion: 'Install missing dependencies:\n\`\`\`bash\nnpm install\n\`\`\`'
            });
        }
        // Generic errors
        else if (line.match(/error:|ERROR:/i) && !errors.some(e => e.message === line.trim())) {
            errors.push({
                type: 'unknown',
                message: line.trim(),
                suggestion: 'Review error message and check documentation for the specific tool.'
            });
        }
    }
    return errors;
}
/**
 * Check if build succeeded
 */
function buildSucceeded(output) {
    const successPatterns = [
        /built successfully/i,
        /build completed/i,
        /compiled successfully/i,
        /finished.*success/i,
    ];
    const failurePatterns = [
        /build failed/i,
        /compilation failed/i,
        /error:/i,
        /failed to compile/i,
    ];
    // If any failure pattern matches, build failed
    if (failurePatterns.some(pattern => pattern.test(output))) {
        return false;
    }
    // If any success pattern matches, build succeeded
    if (successPatterns.some(pattern => pattern.test(output))) {
        return true;
    }
    // Default: check exit code (if available) or assume success if no errors
    return true;
}
async function buildAnalyzerHook(event) {
    const { tool, result } = event;
    // Only process Bash tool
    if (tool.name !== 'Bash') {
        return result;
    }
    // Check if command is a build command
    const command = tool.params?.command || '';
    if (!isBuildCommand(command)) {
        return result;
    }
    // Analyze build output
    const succeeded = buildSucceeded(result);
    const errors = parseErrors(result);
    if (succeeded && errors.length === 0) {
        // Build succeeded
        const analysis = `

## 🔧 Build Analysis

**Status:** ✅ BUILD SUCCESSFUL
**Errors:** 0

Build completed without errors.
`;
        return result + analysis;
    }
    else {
        // Build failed or has errors
        const errorsList = errors.slice(0, 5).map((error, index) => {
            const errorType = error.type.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
            return `
### Error ${index + 1}: ${errorType}
${error.file ? `**File:** ${error.file}${error.line ? `:${error.line}` : ''}` : ''}
**Issue:** ${error.message}

**Suggested Fix:**
${error.suggestion}
`;
        }).join('\n');
        const moreErrors = errors.length > 5 ? `\n... and ${errors.length - 5} more errors` : '';
        const analysis = `

## 🔧 Build Analysis

**Status:** ❌ BUILD FAILED
**Errors:** ${errors.length}

${errorsList}${moreErrors}

### Next Steps:
1. Fix errors in order (dependencies first)
2. Run build command again after each fix
3. Commit once all errors resolved

### Common Quick Fixes:
\`\`\`bash
# Reinstall dependencies
npm install

# Clear cache and rebuild
rm -rf node_modules package-lock.json
npm install
npm run build

# Check TypeScript config
npx tsc --showConfig
\`\`\`
`;
        return result + analysis;
    }
}
