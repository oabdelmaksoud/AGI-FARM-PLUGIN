import path from 'path';
import { ensureJsonFile, safeReadJson, safeWriteJson } from './storage.js';

const DEFAULT_REGISTRY = {
  skills: [
    {
      id: 'research-basic',
      name: 'Research Basic',
      enabled: true,
      intentMatchers: ['research', 'analyze', 'investigate'],
      stepKinds: ['analyze'],
      entrypoint: 'internal:research',
      version: '1.0.0',
      safetyProfile: 'low',
    },
    {
      id: 'execution-basic',
      name: 'Execution Basic',
      enabled: true,
      intentMatchers: ['build', 'implement', 'execute', 'create'],
      stepKinds: ['execute'],
      entrypoint: 'internal:execute',
      version: '1.0.0',
      safetyProfile: 'medium',
    },
  ],
};

export class SkillsService {
  constructor(workspace) {
    this.filePath = path.join(workspace, 'SKILLS_REGISTRY.json');
    ensureJsonFile(this.filePath, DEFAULT_REGISTRY);
  }

  list() {
    const data = safeReadJson(this.filePath, DEFAULT_REGISTRY);
    return Array.isArray(data.skills) ? data.skills : [];
  }

  setEnabled(skillId, enabled) {
    const data = safeReadJson(this.filePath, DEFAULT_REGISTRY);
    const skills = Array.isArray(data.skills) ? data.skills : [];
    const idx = skills.findIndex((s) => s.id === skillId);
    if (idx === -1) return { ok: false, error: 'skill_not_found' };
    skills[idx] = { ...skills[idx], enabled: !!enabled };
    safeWriteJson(this.filePath, { skills });
    return { ok: true, skill: skills[idx] };
  }

  matchSkill(intent, stepKind) {
    const text = String(intent || '').toLowerCase();
    const enabled = this.list().filter((s) => s.enabled !== false);
    let best = null;
    let bestScore = -1;

    for (const s of enabled) {
      let score = 0;
      const kinds = Array.isArray(s.stepKinds) ? s.stepKinds : [];
      if (stepKind && kinds.includes(stepKind)) score += 2;
      const matchers = Array.isArray(s.intentMatchers) ? s.intentMatchers : [];
      for (const m of matchers) {
        if (text.includes(String(m).toLowerCase())) score += 1;
      }
      if (score > bestScore) {
        best = s;
        bestScore = score;
      }
    }

    return best;
  }
}
