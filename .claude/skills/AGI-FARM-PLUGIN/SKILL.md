# AGI-FARM-PLUGIN Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill covers development patterns for the AGI-FARM-PLUGIN, an Express.js-based plugin system that provides a dashboard interface for AGI farm management. The codebase combines a React frontend with an Express backend, includes agent templates, and integrates with the Everything Claude Code (ECC) ecosystem.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names
- Test files follow pattern: `*.test.js`
- Documentation files use kebab-case: `feature-guide.md`

### Import/Export Style
```javascript
// Mixed import style - both default and named imports
import express from 'express';
import { someFunction, anotherFunction } from './utils';

// Default exports preferred
export default class DashboardService {
  // implementation
}
```

### Commit Messages
Follow conventional commit format with these prefixes:
- `feat:` - New features
- `fix:` - Bug fixes  
- `docs:` - Documentation changes
- `chore:` - Maintenance tasks
- `release:` - Version releases

Average commit message length: ~63 characters

## Workflows

### Version Release Workflow
**Trigger:** When releasing a new version  
**Command:** `/release`

1. Update version in `package.json`
2. Update version in `openclaw.plugin.json` 
3. Add release notes to `CHANGELOG.md`
4. Update `package-lock.json` if dependencies changed
5. Update `README.md` with new features if applicable

```json
// package.json
{
  "version": "1.2.3"
}

// openclaw.plugin.json  
{
  "version": "1.2.3"
}
```

### Dashboard Rebuild Workflow
**Trigger:** When dashboard React components are modified  
**Command:** `/rebuild-dashboard`

1. Modify React components in `dashboard-react/src/components/`
2. Run the build process: `npm run build:dashboard`
3. Update compiled assets in `dashboard-dist/assets/`
4. Update `dashboard-dist/index.html` with new asset hashes

```bash
# Build command
npm run build:dashboard

# Results in updated files:
# dashboard-dist/assets/index-abc123.js
# dashboard-dist/assets/index-def456.css  
# dashboard-dist/index.html
```

### Server API Endpoint Workflow
**Trigger:** When adding new server functionality  
**Command:** `/add-endpoint`

1. Add new endpoint to `server/dashboard.js`
2. Create or update service in `server/services/`
3. Update React components to consume new API
4. Rebuild dashboard distribution files

```javascript
// server/dashboard.js
app.get('/api/new-endpoint', async (req, res) => {
  const service = new NewService();
  const result = await service.process(req.query);
  res.json(result);
});

// dashboard-react/src/components/NewComponent.jsx
const fetchData = async () => {
  const response = await fetch('/api/new-endpoint');
  const data = await response.json();
  setData(data);
};
```

### Security Hardening Workflow  
**Trigger:** When implementing security improvements  
**Command:** `/security-fix`

1. Update server endpoints with CSRF protection
2. Add input sanitization and validation
3. Update React components with safety guards
4. Add validation checks throughout
5. Update or add corresponding tests

```javascript
// Server security example
app.use(csrf());
app.post('/api/sensitive', validateInput, (req, res) => {
  const sanitized = sanitizeInput(req.body);
  // process safely
});

// React component safety
const SafeComponent = ({ userInput }) => {
  const sanitizedInput = DOMPurify.sanitize(userInput);
  return <div dangerouslySetInnerHTML={{ __html: sanitizedInput }} />;
};
```

### Documentation Update Workflow
**Trigger:** When documenting new features or processes  
**Command:** `/document-feature`

1. Create new `.md` documentation file with descriptive name
2. Update `README.md` with new sections or links
3. Add entry to `CHANGELOG.md` documenting the changes
4. Add related documentation files if needed

```markdown
<!-- New feature documentation -->
# New Feature Guide

## Overview
Brief description of the feature

## Usage
Step-by-step instructions

## API Reference
Endpoint documentation
```

### ECC Integration Workflow
**Trigger:** When syncing with upstream ECC repository  
**Command:** `/sync-ecc`

1. Add or update files in `ecc-resources/` directory
2. Run integration scripts to process new resources
3. Update `ecc-resources/ECC_VERSION` with new version
4. Update `config/ecc-mappings.json` with new mappings

```javascript
// scripts/update-ecc-resources.js
const updateECCResources = async () => {
  await fetchLatestECCFiles();
  await updateVersionFile();
  await regenerateMappings();
};
```

### Template Agent Workflow
**Trigger:** When adding new agent personalities or updating existing ones  
**Command:** `/add-agent-template`

1. Create or update template files in `templates/`
2. Add agent personality files in `templates/agency-agents/`
3. Update template processing with `scripts/convert-agency-agent.js`
4. Update configuration mappings if needed

```markdown
<!-- templates/agency-agents/new-agent/SOUL.md -->
# Agent Personality: New Agent

## Core Traits
- Helpful and knowledgeable
- Specializes in specific domain

## Behavioral Guidelines  
- Always provide accurate information
- Maintain professional tone
```

## Testing Patterns

Tests use Jest framework with the following conventions:

```javascript
// example.test.js
describe('Component Name', () => {
  test('should perform expected behavior', () => {
    // Arrange
    const input = 'test data';
    
    // Act  
    const result = functionUnderTest(input);
    
    // Assert
    expect(result).toBe('expected output');
  });
});
```

## Commands

| Command | Purpose |
|---------|---------|
| `/release` | Prepare and execute version release |
| `/rebuild-dashboard` | Rebuild React dashboard distribution |
| `/add-endpoint` | Add new API endpoint with frontend integration |
| `/security-fix` | Apply security improvements across components |
| `/document-feature` | Create comprehensive feature documentation |
| `/sync-ecc` | Sync with upstream ECC repository resources |
| `/add-agent-template` | Add or update agent personality templates |