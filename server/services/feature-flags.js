export function getFeatureFlags() {
  return {
    jobs: process.env.AGI_FARM_FEATURE_JOBS === '1',
    skills: process.env.AGI_FARM_FEATURE_SKILLS === '1',
    memory: process.env.AGI_FARM_FEATURE_MEMORY === '1',
    policy: process.env.AGI_FARM_FEATURE_POLICY === '1',
    metering: process.env.AGI_FARM_FEATURE_METERING === '1',
    approvals: process.env.AGI_FARM_FEATURE_APPROVALS === '1',
  };
}

export function isFeatureEnabled(flags, name) {
  return !!flags?.[name];
}
