```markdown
# AGI-FARM-PLUGIN Development Patterns

> Auto-generated skill from repository analysis

## Overview

This skill covers development patterns for the AGI-FARM-PLUGIN, an Express.js-based plugin system with a React dashboard interface. The codebase follows a structured approach combining backend API development with frontend dashboard components, featuring server-sent events for real-time updates and a comprehensive build system for dashboard distribution.

## Coding Conventions

### File Naming
- Use **camelCase** for all file names
- Test files follow the pattern `*.test.js`
- Component files use `.jsx` extension for React components
- Service files are organized in `server/services/`

### Import/Export Style
```javascript
// Mixed import styles - adapt to context
import express from 'express';
const { someUtil } = require('../utils');

// Default exports preferred
export default MyComponent;
module.exports = myService;
```

### Commit Messages
- Follow conventional commit format
- Use prefixes: `feat:`, `fix:`, `docs:`, `chore:`, `release:`
- Keep messages around 64 characters
- Examples:
  ```
  feat: add new dashboard tab for system monitoring
  fix: resolve security vulnerability in API validation
  docs: update README with new installation steps
  ```

## Workflows

### Version Release Management
**Trigger:** When preparing a new release  
**Command:** `/release-version`

1. Update version in `package.json`
2. Update version in `openclaw.plugin.json` 
3. Update `CHANGELOG.md` with release notes and new features
4. If dashboard changes, update `dashboard-react/package.json` version
5. Commit with descriptive version bump message
6. Ensure `package-lock.json` is updated

```json
// package.json
{
  "version": "2.1.0"
}

// openclaw.plugin.json  
{
  "version": "2.1.0"
}
```

### Dashboard Rebuild Process
**Trigger:** After modifying React dashboard components  
**Command:** `/rebuild-dashboard`

1. Modify React components in `dashboard-react/src/`
2. Run build process to generate new assets
3. Update `dashboard-dist/assets/*.js` and `*.css` with new bundled files
4. Update `dashboard-dist/index.html` with new asset references
5. Commit both source and distribution changes

```bash
# Typical build commands
cd dashboard-react
npm run build
# Copy build output to dashboard-dist/
```

### API Endpoint Development
**Trigger:** When adding new dashboard functionality  
**Command:** `/add-api-endpoint`

1. Add new endpoint to `server/dashboard.js`
2. Create or update corresponding service in `server/services/`
3. Update frontend components to consume new API
4. Add API client functions in `dashboard-react/src/lib/api.js`
5. Rebuild dashboard distribution
6. Test endpoint integration

```javascript
// server/dashboard.js
app.get('/api/new-feature', async (req, res) => {
  const data = await newFeatureService.getData();
  res.json(data);
});

// dashboard-react/src/lib/api.js
export const fetchNewFeatureData = () => {
  return fetch('/api/new-feature').then(r => r.json());
};
```

### Security Bug Fixes
**Trigger:** When security issues are discovered during code review  
**Command:** `/fix-security-issue`

1. Identify security vulnerability in server code
2. Update `server/dashboard.js` with validation fixes
3. Update related service files with security improvements
4. Add or update tests to cover security scenarios
5. Commit with descriptive security fix message

```javascript
// Example security fix
app.post('/api/action', (req, res) => {
  // Add input validation
  if (!req.body.param || typeof req.body.param !== 'string') {
    return res.status(400).json({ error: 'Invalid input' });
  }
  // Sanitize input
  const cleanParam = sanitize(req.body.param);
  // Process securely...
});
```

### Documentation Updates
**Trigger:** After adding new features or making significant changes  
**Command:** `/update-docs`

1. Update `README.md` with new features section
2. Update `CHANGELOG.md` with detailed changes and breaking changes
3. Add new dedicated documentation files if needed
4. Update package descriptions in `package.json` if scope changed
5. Ensure all new APIs are documented

### Dashboard Tab Component Creation
**Trigger:** When adding new dashboard functionality  
**Command:** `/add-dashboard-tab`

1. Create new tab component in `dashboard-react/src/components/tabs/`
2. Register tab in `dashboard-react/src/App.jsx`
3. Add corresponding API endpoints in `server/dashboard.js`
4. Update SSE (Server-Sent Events) data stream with new data
5. Rebuild `dashboard-dist/` with new component

```jsx
// dashboard-react/src/components/tabs/NewTab.jsx
import React from 'react';

const NewTab = ({ data }) => {
  return (
    <div className="tab-content">
      {/* Tab implementation */}
    </div>
  );
};

export default NewTab;

// dashboard-react/src/App.jsx
import NewTab from './components/tabs/NewTab';

// Add to tabs array
const tabs = [
  // ... existing tabs
  { id: 'newtab', label: 'New Feature', component: NewTab }
];
```

### ECC Resource Integration
**Trigger:** When syncing with upstream ECC repository  
**Command:** `/sync-ecc-resources`

1. Update `ecc-resources/` directory with new files from upstream
2. Update `ECC_VERSION` tracking file with new version
3. Modify templates in `templates/` to include new ECC sections
4. Update configuration mappings in `config/ecc-mappings.json`
5. Update documentation about new ECC features

```markdown
// ecc-resources/ECC_VERSION
v2.1.0-20240115

// Update templates to reference new resources
## ECC Integration
This plugin now supports ECC v2.1.0 features including:
- New resource templates
- Enhanced mappings
```

## Testing Patterns

### Test Structure
- Use **Jest** testing framework
- Test files follow `*.test.js` pattern
- Place tests alongside source files or in dedicated `tests/` directory

```javascript
// example.test.js
describe('API Endpoint Tests', () => {
  test('should return valid data', async () => {
    const response = await request(app)
      .get('/api/endpoint')
      .expect(200);
    
    expect(response.body).toHaveProperty('data');
  });
});
```

## Commands

| Command | Purpose |
|---------|---------|
| `/release-version` | Update version across all package files and generate changelog |
| `/rebuild-dashboard` | Rebuild React dashboard distribution after UI changes |
| `/add-api-endpoint` | Create new API endpoint with frontend integration |
| `/fix-security-issue` | Address security vulnerabilities with proper validation |
| `/update-docs` | Update README and documentation with new features |
| `/add-dashboard-tab` | Create new dashboard tab with full integration |
| `/sync-ecc-resources` | Update ECC resources from upstream repository |
```