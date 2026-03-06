"use strict";
/**
 * Auto-Format Hook Handler
 *
 * Auto-formats JS/TS files after edits using Biome or Prettier (auto-detected).
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
exports.default = autoFormatHook;
const child_process_1 = require("child_process");
const util_1 = require("util");
const path = __importStar(require("path"));
const execAsync = (0, util_1.promisify)(child_process_1.exec);
/**
 * Detect available formatter in project
 */
async function detectFormatter(cwd) {
    try {
        // Check for Biome first (recommended)
        await execAsync('npx @biomejs/biome --version', { cwd, timeout: 5000 });
        return 'biome';
    }
    catch {
        try {
            // Fall back to Prettier
            await execAsync('npx prettier --version', { cwd, timeout: 5000 });
            return 'prettier';
        }
        catch {
            return 'none';
        }
    }
}
/**
 * Format file with detected formatter
 */
async function formatFile(filePath, formatter) {
    const cwd = path.dirname(filePath);
    const fileName = path.basename(filePath);
    try {
        if (formatter === 'biome') {
            await execAsync(`npx @biomejs/biome format --write "${fileName}"`, {
                cwd,
                timeout: 10000,
            });
            return { success: true, message: 'Formatted with Biome' };
        }
        else if (formatter === 'prettier') {
            await execAsync(`npx prettier --write "${fileName}"`, {
                cwd,
                timeout: 10000,
            });
            return { success: true, message: 'Formatted with Prettier' };
        }
        else {
            return { success: false, message: 'No formatter detected' };
        }
    }
    catch (error) {
        return { success: false, message: `Formatting failed: ${error.message}` };
    }
}
async function autoFormatHook(event) {
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
        }
        else {
            // Formatting failed - show warning but don't block
            const warning = `

## 🎨 Auto-Format Results

**Status:** ⚠️ ${formatResult.message}

File was not formatted. This is non-blocking.
`;
            return result + warning;
        }
    }
    catch (error) {
        // Any error - skip silently to avoid cluttering output
        return result;
    }
}
