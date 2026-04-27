import { envSchema } from './schema.js'

export type { EnvSchema as Env } from './schema.js'
export { envSchema } from './schema.js'

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('\n❌ Variables de entorno inválidas — revisa tu .env:')
  const fields = result.error.flatten().fieldErrors
  for (const [key, errors] of Object.entries(fields)) {
    console.error(`  ${key}: ${(errors ?? []).join(', ')}`)
  }
  process.exit(1)
}

export const env = result.data
