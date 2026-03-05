function parseFlag(value, defaultValue = true) {
  if (value == null || value === '') return defaultValue;
  const normalized = String(value).trim().toLowerCase();
  if (['0', 'false', 'off', 'no'].includes(normalized)) return false;
  if (['1', 'true', 'on', 'yes'].includes(normalized)) return true;
  return defaultValue;
}

export function getFeatureFlags() {
  return {
    jobs: parseFlag(process.env.AGI_FARM_FEATURE_JOBS, true),
    skills: parseFlag(process.env.AGI_FARM_FEATURE_SKILLS, true),
    memory: parseFlag(process.env.AGI_FARM_FEATURE_MEMORY, true),
    policy: parseFlag(process.env.AGI_FARM_FEATURE_POLICY, true),
    metering: parseFlag(process.env.AGI_FARM_FEATURE_METERING, true),
    approvals: parseFlag(process.env.AGI_FARM_FEATURE_APPROVALS, true),
  };
}

export function isFeatureEnabled(flags, name) {
  return !!flags?.[name];
}
