import { buildServer } from './server.js'
import { env } from '@colacero/env'

const app = buildServer()

app.listen({ port: env.API_PORT, host: env.API_HOST }, (err) => {
  if (err) {
    app.log.error(err)
    process.exit(1)
  }
})
