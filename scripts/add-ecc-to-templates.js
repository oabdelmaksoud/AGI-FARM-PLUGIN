#!/usr/bin/env node
/**
 * Add ECC Resources section to all SOUL.md templates
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMPLATES_DIR = path.join(__dirname, '../templates');
const ECC_SECTION = `
---

## 🎯 ECC Resources Available

**Everything Claude Code (ECC)** provides production-ready workflows, patterns, and specialized agents.

### Specialized Agents for You
{{#ECC_AGENTS}}
- **{{name}}** (\`{{ECC_PATH}}/agents/{{file}}\`) — {{description}}
{{/ECC_AGENTS}}

### Skills Library
{{#ECC_SKILLS}}
- \`@{{name}}\` → \`{{ECC_PATH}}/skills/{{name}}/skill.md\`
{{/ECC_SKILLS}}

### Quick Commands
{{#ECC_COMMANDS}}
- \`/{{name}}\` — {{description}}
{{/ECC_COMMANDS}}

### ECC Core Principles
{{#ECC_PRINCIPLES}}
- {{.}}
{{/ECC_PRINCIPLES}}

**How to Use ECC Resources:**
1. **Auto-applied**: Your role automatically includes relevant skills in context
2. **Explicit reference**: Use \`@skill-name\` to invoke specific patterns
3. **Commands**: Use \`/command\` slash commands for common workflows
4. **Agents**: Delegate specialized tasks to ECC agents when needed
`;

const templates = [
  'SOUL.md.anchor',
  'SOUL.md.cipher',
  'SOUL.md.evolve',
  'SOUL.md.generic',
  'SOUL.md.lens',
  'SOUL.md.nova',
  'SOUL.md.pixel',
  'SOUL.md.vista'
];

for (const template of templates) {
  const filePath = path.join(TEMPLATES_DIR, template);

  if (!fs.existsSync(filePath)) {
    console.log(`Skipping ${template} (not found)`);
    continue;
  }

  const content = fs.readFileSync(filePath, 'utf-8');

  // Check if already has ECC section
  if (content.includes('## 🎯 ECC Resources Available')) {
    console.log(`✓ ${template} already has ECC section`);
    continue;
  }

  // Append ECC section at the end
  const updatedContent = content + ECC_SECTION;
  fs.writeFileSync(filePath, updatedContent, 'utf-8');
  console.log(`✓ Added ECC section to ${template}`);
}

console.log('\nDone!');
