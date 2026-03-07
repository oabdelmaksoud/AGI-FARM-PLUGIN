#!/usr/bin/env node
/**
 * Agent Registry - Index all available agent templates
 * Supports AGI Farm core, ECC, and Agency-Agents
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMPLATES_DIR = path.resolve(__dirname, '../../templates');

/**
 * Load all available agents from templates directory
 * @returns {Object} Registry object with agents organized by source
 */
export function loadAgentRegistry() {
  const registry = {
    'agi-farm': [],
    'ecc': [],
    'agency-agents': [],
  };

  // Load AGI Farm core agents
  try {
    const coreTemplates = fs.readdirSync(TEMPLATES_DIR)
      .filter(f => f.startsWith('SOUL.md.') && !f.includes('generic') && !f.includes('main'));

    for (const file of coreTemplates) {
      const agentId = file.replace('SOUL.md.', '');
      const content = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
      const metadata = extractMetadata(content, agentId);

      registry['agi-farm'].push({
        id: `agi-farm-${agentId}`,
        agentId: agentId,
        source: 'agi-farm',
        template: file,
        category: 'core',
        ...metadata,
      });
    }
  } catch (err) {
    console.error('Warning: Could not load AGI Farm core templates:', err.message);
  }

  // Load Agency-Agents templates
  try {
    const agencyDir = path.join(TEMPLATES_DIR, 'agency-agents');
    if (fs.existsSync(agencyDir)) {
      const categories = fs.readdirSync(agencyDir);

      for (const category of categories) {
        const categoryPath = path.join(agencyDir, category);
        if (!fs.statSync(categoryPath).isDirectory()) continue;

        const templates = fs.readdirSync(categoryPath).filter(f => f.endsWith('.md'));

        for (const file of templates) {
          const agentId = file.replace('.md', '');
          const content = fs.readFileSync(path.join(categoryPath, file), 'utf-8');
          const metadata = extractMetadata(content, agentId);

          registry['agency-agents'].push({
            id: `agency-agents-${category}-${agentId}`,
            agentId: agentId,
            source: 'agency-agents',
            template: `agency-agents/${category}/${file}`,
            category,
            ...metadata,
          });
        }
      }
    }
  } catch (err) {
    console.error('Warning: Could not load Agency-Agents templates:', err.message);
  }

  return registry;
}

/**
 * Extract metadata from SOUL.md content
 * @param {string} content - File content
 * @param {string} fallbackName - Fallback name if extraction fails
 * @returns {Object} Metadata object
 */
function extractMetadata(content, fallbackName) {
  // Extract name from first # heading
  const nameMatch = content.match(/^#\s+(.+)$/m);
  const name = nameMatch ? nameMatch[1].trim() : formatAgentName(fallbackName);

  // Extract description from first > quote or paragraph
  const descMatch = content.match(/(?:^|\n)>\s*(.+)/m);
  let description = descMatch ? descMatch[1].trim() : '';

  // If no quote, try to get first paragraph after heading
  if (!description) {
    const paragraphMatch = content.match(/^#.+\n\n(.+?)(?:\n\n|$)/m);
    description = paragraphMatch ? paragraphMatch[1].trim().substring(0, 100) : 'AI specialist';
  }

  // Extract role from content (look for "Role:", "You are", etc.)
  const roleMatch = content.match(/(?:Role|You are)[:\s]+([^\n]+)/i);
  const role = roleMatch ? roleMatch[1].trim() : 'Specialist';

  // Extract emoji if present
  const emojiMatch = content.match(/^#\s+([\p{Emoji}])\s/u) || content.match(/([\p{Emoji}])/u);
  const emoji = emojiMatch ? emojiMatch[1] : getDefaultEmoji(fallbackName);

  return {
    name,
    description: description.length > 150 ? description.substring(0, 147) + '...' : description,
    role,
    emoji,
  };
}

/**
 * Format agent ID into human-readable name
 * @param {string} id - Agent ID
 * @returns {string} Formatted name
 */
function formatAgentName(id) {
  return id
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get default emoji based on agent ID
 * @param {string} id - Agent ID
 * @returns {string} Emoji
 */
function getDefaultEmoji(id) {
  const emojiMap = {
    'sage': '🔮',
    'forge': '⚒️',
    'pixel': '🐛',
    'vigil': '🛡️',
    'vista': '🔭',
    'cipher': '🔊',
    'anchor': '⚓',
    'lens': '📡',
    'evolve': '🔄',
    'nova': '🧪',
  };
  return emojiMap[id] || '🤖';
}

/**
 * Get emoji for category
 * @param {string} category - Category name
 * @returns {string} Emoji
 */
export function getCategoryEmoji(category) {
  const emojis = {
    'core': '🦅',
    'testing': '🧪',
    'engineering': '💻',
    'design': '🎨',
    'marketing': '📈',
    'product': '📋',
    'project-management': '📊',
    'support': '🛠️',
    'spatial-computing': '🥽',
    'specialized': '⚙️',
    'strategy': '🎯',
  };
  return emojis[category] || '📁';
}

/**
 * Format category name for display
 * @param {string} category - Category name
 * @returns {string} Formatted name
 */
export function formatCategoryName(category) {
  return category
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Count agents in a category
 * @param {Object} registry - Agent registry
 * @param {string} category - Category name
 * @returns {number} Count
 */
export function countAgentsInCategory(registry, category) {
  return Object.values(registry)
    .flat()
    .filter(a => a.category === category).length;
}

/**
 * Get all unique categories
 * @param {Object} registry - Agent registry
 * @returns {Array} Array of category names
 */
export function getCategories(registry) {
  const categories = new Set();
  Object.values(registry).flat().forEach(agent => {
    categories.add(agent.category);
  });
  return Array.from(categories).sort();
}
