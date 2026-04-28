import fp from 'fastify-plugin'
import multipart from '@fastify/multipart'
import staticFiles from '@fastify/static'
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { env } from '@colacero/env'

export const uploadPlugin = fp(async (app) => {
  const uploadDir = resolve(env.UPLOAD_DIR)

  // Asegurarse de que el directorio existe al arrancar
  await mkdir(uploadDir, { recursive: true })

  app.register(multipart, {
    limits: {
      fileSize: 5 * 1024 * 1024, // 5 MB
      files: 1,
    },
  })

  app.register(staticFiles, {
    root:   uploadDir,
    prefix: '/uploads/',
  })
})
