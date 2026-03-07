#!/usr/bin/env node

/**
 * Agency-Agents to SOUL.md Converter
 *
 * Converts agency-agents markdown files to AGI Farm SOUL.md format.
 *
 * Usage:
 *   node scripts/convert-agency-agent.js <input-file> <output-file>
 *   node scripts/convert-agency-agent.js --batch <agency-agents-dir> <templates-dir>
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Category mapping for AGI Farm
const CATEGORY_MAP = {
  'engineering': 'engineering',
  'design': 'design',
  'marketing': 'marketing',
  'product': 'product',
  'project-management': 'project-management',
  'testing': 'quality-assurance',
  'support': 'support',
  'spatial-computing': 'specialized',
  'specialized': 'specialized',
  'strategy': 'leadership',
};

// Role mapping for AGI Farm
const ROLE_MAP = {
  'engineering-frontend-developer': 'frontend-developer',
  'engineering-backend-architect': 'backend-architect',
  'engineering-mobile-app-builder': 'mobile-developer',
  'engineering-ai-engineer': 'ai-engineer',
  'engineering-devops-automator': 'devops-engineer',
  'engineering-rapid-prototyper': 'prototyper',
  'engineering-senior-developer': 'senior-developer',
  'design-ui-designer': 'ui-designer',
  'design-ux-researcher': 'ux-researcher',
  'design-ux-architect': 'ux-architect',
  'design-brand-guardian': 'brand-manager',
  'design-visual-storyteller': 'visual-designer',
  'design-whimsy-injector': 'ux-enhancer',
  'design-image-prompt-engineer': 'image-engineer',
  'marketing-growth-hacker': 'growth-hacker',
  'marketing-content-creator': 'content-creator',
  'marketing-twitter-engager': 'social-media-manager',
  'marketing-tiktok-strategist': 'tiktok-specialist',
  'marketing-instagram-curator': 'instagram-specialist',
  'marketing-reddit-community-builder': 'community-manager',
  'marketing-app-store-optimizer': 'aso-specialist',
  'marketing-social-media-strategist': 'social-strategist',
  'product-sprint-prioritizer': 'product-manager',
  'product-trend-researcher': 'market-researcher',
  'product-feedback-synthesizer': 'user-researcher',
  'project-management-studio-producer': 'studio-producer',
  'project-management-project-shepherd': 'project-coordinator',
  'project-manager-senior': 'senior-pm',
  'project-management-studio-operations': 'operations-manager',
  'project-management-experiment-tracker': 'experiment-manager',
  'testing-evidence-collector': 'qa-engineer',
  'testing-reality-checker': 'qa-lead',
  'testing-test-results-analyzer': 'test-analyst',
  'testing-performance-benchmarker': 'performance-engineer',
  'testing-api-tester': 'api-tester',
  'testing-tool-evaluator': 'tech-evaluator',
  'testing-workflow-optimizer': 'process-engineer',
  'support-support-responder': 'support-engineer',
  'support-analytics-reporter': 'data-analyst',
  'support-finance-tracker': 'finance-analyst',
  'support-infrastructure-maintainer': 'infrastructure-engineer',
  'support-legal-compliance-checker': 'compliance-officer',
  'support-executive-summary-generator': 'executive-assistant',
  'specialized-agents-orchestrator': 'orchestrator',
  'specialized-data-analytics-reporter': 'business-analyst',
  'specialized-lsp-index-engineer': 'tooling-engineer',
  'specialized-sales-data-extraction-agent': 'data-extraction-specialist',
  'specialized-data-consolidation-agent': 'data-consolidation-specialist',
  'specialized-report-distribution-agent': 'reporting-specialist',
  'specialized-agentic-identity-trust': 'identity-specialist',
};

/**
 * Parse frontmatter from markdown
 */
function parseFrontmatter(content) {
  const frontmatterRegex = /^---\n([\s\S]*?)\n---\n/;
  const match = content.match(frontmatterRegex);

  if (!match) {
    return { frontmatter: {}, content };
  }

  const frontmatterText = match[1];
  const frontmatter = {};

  frontmatterText.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length > 0) {
      frontmatter[key.trim()] = valueParts.join(':').trim();
    }
  });

  const remainingContent = content.replace(frontmatterRegex, '');
  return { frontmatter, content: remainingContent };
}

/**
 * Convert agency-agent markdown to SOUL.md format
 */
function convertToSoulMd(agentContent, filename, category) {
  const { frontmatter, content } = parseFrontmatter(agentContent);

  const agentName = frontmatter.name || 'Unknown Agent';
  const description = frontmatter.description || '';
  const color = frontmatter.color || 'cyan';

  // Determine role from filename
  const baseFilename = path.basename(filename, '.md');
  const role = ROLE_MAP[baseFilename] || baseFilename;
  const agiFarmCategory = CATEGORY_MAP[category] || 'specialized';

  // Build SOUL.md content
  let soulContent = `# ${agentName}

**Role**: ${role}
**Category**: ${agiFarmCategory}
**Source**: Agency-Agents by [@msitarzewski](https://github.com/msitarzewski/agency-agents)

## Overview

${description}

---

${content}

---

## 🔗 Attribution

This agent personality is from the **Agency-Agents** repository by [@msitarzewski](https://github.com/msitarzewski).

**Original Repository**: https://github.com/msitarzewski/agency-agents
**License**: MIT License
**Adapted for**: AGI Farm Plugin

## 🎯 Integration Notes

This agent has been converted from Agency-Agents format to AGI Farm SOUL.md format.

**Conversion Details**:
- Original file: \`${category}/${filename}\`
- AGI Farm role: \`${role}\`
- AGI Farm category: \`${agiFarmCategory}\`
- Color theme: \`${color}\`

**Usage in AGI Farm**:
\`\`\`bash
# Create an agent with this personality
agi-farm setup
# → Select "Agency-Agents Library"
# → Choose "${agentName}"

# Or use directly in workspace
cp templates/agency-agents/${category}/${filename} \\
   ~/.openclaw/workspace/agents-workspaces/<agent-name>/SOUL.md
\`\`\`

**Customization**: Feel free to adapt this personality for your specific needs. The original Agency-Agents template provides a strong foundation.
`;

  return soulContent;
}

/**
 * Convert a single agent file
 */
async function convertSingleAgent(inputFile, outputFile) {
  try {
    console.log(`Converting ${inputFile} → ${outputFile}`);

    const content = await fs.readFile(inputFile, 'utf-8');
    const category = path.basename(path.dirname(inputFile));
    const filename = path.basename(inputFile);

    const soulMd = convertToSoulMd(content, filename, category);

    await fs.mkdir(path.dirname(outputFile), { recursive: true });
    await fs.writeFile(outputFile, soulMd, 'utf-8');

    console.log(`✅ Converted: ${outputFile}`);
  } catch (error) {
    console.error(`❌ Error converting ${inputFile}:`, error.message);
    throw error;
  }
}

/**
 * Batch convert all agents from a directory
 */
async function batchConvert(agencyAgentsDir, templatesDir) {
  console.log(`\n🚀 Batch Converting Agency-Agents\n`);
  console.log(`Source: ${agencyAgentsDir}`);
  console.log(`Target: ${templatesDir}\n`);

  const categories = Object.keys(CATEGORY_MAP);
  let totalConverted = 0;
  let errors = 0;

  for (const category of categories) {
    const categoryDir = path.join(agencyAgentsDir, category);

    try {
      const files = await fs.readdir(categoryDir);
      const mdFiles = files.filter(f => f.endsWith('.md'));

      console.log(`\n📂 Category: ${category} (${mdFiles.length} agents)`);

      for (const file of mdFiles) {
        const inputFile = path.join(categoryDir, file);
        const outputDir = path.join(templatesDir, category);
        const outputFile = path.join(outputDir, file);

        try {
          await convertSingleAgent(inputFile, outputFile);
          totalConverted++;
        } catch (error) {
          console.error(`  ❌ Failed: ${file}`);
          errors++;
        }
      }
    } catch (error) {
      if (error.code === 'ENOENT') {
        console.log(`  ⚠️  Category directory not found: ${category}`);
      } else {
        console.error(`  ❌ Error processing category ${category}:`, error.message);
        errors++;
      }
    }
  }

  console.log(`\n\n✨ Batch Conversion Complete\n`);
  console.log(`Total Converted: ${totalConverted}`);
  console.log(`Errors: ${errors}`);
  console.log(`\nTemplates created in: ${templatesDir}\n`);

  return { totalConverted, errors };
}

/**
 * Main CLI
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help') {
    console.log(`
Agency-Agents to SOUL.md Converter

Usage:
  Single file conversion:
    node scripts/convert-agency-agent.js <input-file> <output-file>

  Batch conversion:
    node scripts/convert-agency-agent.js --batch <agency-agents-dir> <templates-dir>

Examples:
  # Convert single agent
  node scripts/convert-agency-agent.js \\
    /tmp/agency-agents-review/engineering/engineering-frontend-developer.md \\
    templates/agency-agents/engineering/engineering-frontend-developer.md

  # Batch convert all agents
  node scripts/convert-agency-agent.js --batch \\
    /tmp/agency-agents-review \\
    templates/agency-agents
`);
    process.exit(0);
  }

  if (args[0] === '--batch') {
    if (args.length < 3) {
      console.error('Error: --batch requires <agency-agents-dir> <templates-dir>');
      process.exit(1);
    }

    const agencyAgentsDir = path.resolve(args[1]);
    const templatesDir = path.resolve(args[2]);

    const { totalConverted, errors } = await batchConvert(agencyAgentsDir, templatesDir);
    process.exit(errors > 0 ? 1 : 0);
  } else {
    if (args.length < 2) {
      console.error('Error: Single conversion requires <input-file> <output-file>');
      process.exit(1);
    }

    const inputFile = path.resolve(args[0]);
    const outputFile = path.resolve(args[1]);

    await convertSingleAgent(inputFile, outputFile);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}

export { convertToSoulMd, convertSingleAgent, batchConvert };
