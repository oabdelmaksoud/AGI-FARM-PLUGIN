import { enrichProjects } from '../server/utils.js';

describe('enrichProjects', () => {

  const baseTasks = [
    { id: 't1', status: 'complete', title: 'Task 1', assigned_to: 'a1', completed_at: '2025-01-10T00:00:00Z' },
    { id: 't2', status: 'in-progress', title: 'Task 2', assigned_to: 'a2' },
    { id: 't3', status: 'pending', title: 'Task 3', assigned_to: 'a1' },
    { id: 't4', status: 'failed', title: 'Task 4', assigned_to: 'a2', completed_at: '2025-01-09T00:00:00Z' },
    { id: 't5', status: 'blocked', title: 'Task 5', assigned_to: 'a1' },
    { id: 't6', status: 'needs_human_decision', title: 'Task 6', assigned_to: 'a1' },
  ];

  const baseProject = {
    id: 'proj1',
    name: 'Test Project',
    task_ids: ['t1', 't2', 't3', 't4', 't5', 't6'],
    milestones: [
      { name: 'M1', status: 'complete' },
      { name: 'M2', status: 'pending' },
      { name: 'M3', status: 'pending' },
    ],
    team: ['a1', 'a2'],
    created_at: '2025-01-01T00:00:00Z',
    risks: [{ description: 'Risk 1' }],
  };

  const agentPerf = {
    a1: { quality_score: 4.0 },
    a2: { quality_score: 3.5 },
  };

  test('computes correct task counts', () => {
    const [enriched] = enrichProjects([baseProject], baseTasks, agentPerf);
    expect(enriched._task_counts).toEqual({
      total: 6, done: 1, active: 1, pending: 1, blocked: 1, failed: 1, hitl: 1,
    });
  });

  test('computes correct milestone counts', () => {
    const [enriched] = enrichProjects([baseProject], baseTasks, agentPerf);
    expect(enriched._milestone_counts).toEqual({ total: 3, done: 1 });
  });

  test('computes progress percentage', () => {
    const [enriched] = enrichProjects([baseProject], baseTasks, agentPerf);
    expect(enriched._progress_pct).toBe(17); // 1/6 = 16.67 rounds to 17
  });

  test('computes quality score as average of team', () => {
    const [enriched] = enrichProjects([baseProject], baseTasks, agentPerf);
    expect(enriched._quality_score).toBe(3.8); // (4.0 + 3.5) / 2
  });

  test('computes velocity', () => {
    const [enriched] = enrichProjects([baseProject], baseTasks, agentPerf);
    expect(enriched._velocity).toBeGreaterThanOrEqual(0);
    expect(typeof enriched._velocity).toBe('number');
  });

  test('finds last activity from completed tasks', () => {
    const [enriched] = enrichProjects([baseProject], baseTasks, agentPerf);
    expect(enriched._last_activity).toBe('2025-01-10T00:00:00Z');
  });

  test('defaults resolved to false for risks', () => {
    const [enriched] = enrichProjects([baseProject], baseTasks, agentPerf);
    expect(enriched._risks).toEqual([{ description: 'Risk 1', resolved: false }]);
  });

  test('builds activity list from completed tasks', () => {
    const [enriched] = enrichProjects([baseProject], baseTasks, agentPerf);
    expect(enriched._activity.length).toBe(2); // t1 and t4 have completed_at
    expect(enriched._activity[0].ts).toBe('2025-01-10T00:00:00Z'); // most recent first
  });

  test('builds sessions from tasks with proc_id', () => {
    const tasksWithProc = [
      ...baseTasks,
      { id: 't7', status: 'complete', title: 'T7', assigned_to: 'a1', proc_id: 'proc-123' },
    ];
    const proj = { ...baseProject, task_ids: [...baseProject.task_ids, 't7'] };
    const [enriched] = enrichProjects([proj], tasksWithProc, agentPerf);
    expect(enriched._sessions.length).toBe(1);
    expect(enriched._sessions[0].proc_id).toBe('proc-123');
  });

  test('handles project with no tasks', () => {
    const proj = { ...baseProject, task_ids: [] };
    const [enriched] = enrichProjects([proj], baseTasks, agentPerf);
    expect(enriched._task_counts.total).toBe(0);
    expect(enriched._progress_pct).toBe(0);
    expect(enriched._last_activity).toBeNull();
  });

  test('handles project with no milestones', () => {
    const proj = { ...baseProject, milestones: [] };
    const [enriched] = enrichProjects([proj], baseTasks, agentPerf);
    expect(enriched._milestone_counts).toEqual({ total: 0, done: 0 });
  });

  test('returns null quality_score when no team perf data', () => {
    const [enriched] = enrichProjects([baseProject], baseTasks, {});
    expect(enriched._quality_score).toBeNull();
  });

  test('returns empty array for non-array input', () => {
    expect(enrichProjects(null, [], {})).toEqual([]);
    expect(enrichProjects(undefined, [], {})).toEqual([]);
    expect(enrichProjects('not array', [], {})).toEqual([]);
  });

});
