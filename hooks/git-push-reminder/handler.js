"use strict";
/**
 * Git Push Reminder Hook Handler
 *
 * Provides safety reminders before pushing code to ensure changes are
 * reviewed and verified.
 *
 * Events: tool:result
 * Tools: Bash
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = gitPushReminderHook;
/**
 * Check if command is a git push
 */
function isGitPush(command) {
    return command.includes('git push') || command.includes('git-push');
}
/**
 * Check if command is a force push
 */
function isForcePush(command) {
    return command.includes('--force') || command.includes('-f');
}
/**
 * Check if pushing to protected branch
 */
function isProtectedBranch(command) {
    const protectedBranches = ['main', 'master', 'develop', 'production'];
    return protectedBranches.some(branch => command.includes(branch));
}
async function gitPushReminderHook(event) {
    const { tool, result } = event;
    // Only process Bash tool
    if (tool.name !== 'Bash') {
        return result;
    }
    // Check if command is git push
    const command = tool.params?.command || '';
    if (!isGitPush(command)) {
        return result;
    }
    // Check for dangerous operations
    const forcePush = isForcePush(command);
    const protectedBranch = isProtectedBranch(command);
    // Build reminder message
    let reminder = '';
    if (forcePush) {
        // Critical warning for force push
        reminder = `
## 🚨 FORCE PUSH DETECTED

You are about to **force push** which can overwrite remote history!

### ⚠️ Risks:
- Can break other developers' work
- Permanently deletes commits on remote
- May cause merge conflicts for team

### Safer Alternative:
\`\`\`bash
git push --force-with-lease
\`\`\`
This fails if remote has changed since your last fetch.

### Are you absolutely sure?
- [ ] I've confirmed no one else is working on this branch
- [ ] I understand this will overwrite remote history
- [ ] I have a backup of the remote state

---

`;
    }
    else if (protectedBranch) {
        // Warning for pushing to protected branch
        reminder = `
## ⚠️ Pushing to Protected Branch

You are pushing to a protected branch (main/master/develop).

### Pre-Push Checklist:
- [ ] All tests pass locally
- [ ] Code has been reviewed
- [ ] Commit messages are clear
- [ ] No debug code (console.log, etc.)
- [ ] CI will pass

### Recommended: Create PR instead
\`\`\`bash
gh pr create --base main --head $(git branch --show-current)
\`\`\`

---

`;
    }
    else {
        // Standard reminder for regular push
        reminder = `
## ⚠️ Git Push Safety Checklist

Before pushing to remote, verify:

### 1. Review Changes
\`\`\`bash
git diff origin/\$(git branch --show-current)..HEAD
git log origin/\$(git branch --show-current)..HEAD --oneline
\`\`\`

### 2. Run Quality Checks
\`\`\`bash
npm run build    # Verify build
npm test         # Run tests
npm run lint     # Lint check
\`\`\`

### 3. Verify Commits
- Clear and descriptive commit messages?
- Follow project conventions?
- No WIP or temp commits?

### 4. Check Branch
- Pushing to correct branch?
- Branch name follows conventions?

---

`;
    }
    // Prepend reminder to result
    return reminder + result;
}
