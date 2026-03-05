import { getFeatureFlags } from '../server/services/feature-flags.js';

describe('getFeatureFlags', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  test('defaults all feature flags to enabled when env vars are missing', () => {
    delete process.env.AGI_FARM_FEATURE_JOBS;
    delete process.env.AGI_FARM_FEATURE_SKILLS;
    delete process.env.AGI_FARM_FEATURE_MEMORY;
    delete process.env.AGI_FARM_FEATURE_POLICY;
    delete process.env.AGI_FARM_FEATURE_METERING;
    delete process.env.AGI_FARM_FEATURE_APPROVALS;

    expect(getFeatureFlags()).toEqual({
      jobs: true,
      skills: true,
      memory: true,
      policy: true,
      metering: true,
      approvals: true,
    });
  });

  test('respects explicit false values', () => {
    process.env.AGI_FARM_FEATURE_JOBS = '0';
    process.env.AGI_FARM_FEATURE_SKILLS = 'false';
    process.env.AGI_FARM_FEATURE_MEMORY = 'off';
    process.env.AGI_FARM_FEATURE_POLICY = 'no';
    process.env.AGI_FARM_FEATURE_METERING = '1';
    process.env.AGI_FARM_FEATURE_APPROVALS = 'true';

    expect(getFeatureFlags()).toEqual({
      jobs: false,
      skills: false,
      memory: false,
      policy: false,
      metering: true,
      approvals: true,
    });
  });
});
