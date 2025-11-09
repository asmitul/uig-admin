const REQUIRED_R2_ENV_KEYS = [
  'R2_ACCESS_KEY_ID',
  'R2_SECRET_ACCESS_KEY',
  'R2_ENDPOINT',
  'R2_BUCKET',
] as const

type R2EnvKey = (typeof REQUIRED_R2_ENV_KEYS)[number]

export const getMissingR2Env = (): R2EnvKey[] =>
  REQUIRED_R2_ENV_KEYS.filter((key) => !process.env[key])

export const isR2Configured = (): boolean => getMissingR2Env().length === 0

export const requiredR2EnvKeys = [...REQUIRED_R2_ENV_KEYS]
