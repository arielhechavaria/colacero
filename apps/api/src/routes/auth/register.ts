import crypto from 'node:crypto'
import type { FastifyInstance } from 'fastify'
import { validateSlug } from '@colacero/shared'
import { env } from '@colacero/env'
import { hashPassword } from '../../services/auth.service.js'
import { issueRefreshToken, hashToken } from '../../services/token.service.js'
import { sendVerificationEmail } from '../../services/email.service.js'
import { setAuthCookies } from '../../utils/cookies.js'

interface RegisterBody {
  slug:         string
  businessName: string
  ownerName:    string
  email:        string
  password:     string
}

export async function registerRoute(app: FastifyInstance) {
  app.post<{ Body: RegisterBody }>('/register', {
    schema: {
      tags:    ['auth'],
      summary: 'Registro de nuevo negocio — crea Business + User OWNER, emite cookies',
      body: {
        type:       'object',
        required:   ['slug', 'businessName', 'email', 'password'],
        properties: {
          slug:         { type: 'string' },
          businessName: { type: 'string', minLength: 2, maxLength: 60 },
          ownerName:    { type: 'string' },
          email:        { type: 'string', format: 'email' },
          password:     { type: 'string', minLength: 10 },
        },
      },
      response: {
        201: {
          type:       'object',
          properties: {
            user:     { type: 'object' },
            business: { type: 'object' },
          },
        },
        409: {
          type:       'object',
          properties: { error: { type: 'string' } },
        },
        422: {
          type:       'object',
          properties: { error: { type: 'string' } },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    if (req.validationError) {
      return reply.status(422).send({ error: 'validation_error' })
    }

    const slug         = req.body.slug.toLowerCase()
    const businessName = req.body.businessName.trim()
    const ownerName    = req.body.ownerName?.trim() ?? ''
    const email        = req.body.email.toLowerCase()
    const { password } = req.body

    // Validar slug
    const slugValidation = validateSlug(slug)
    if (!slugValidation.valid) {
      return reply.status(422).send({ error: `slug_${slugValidation.error}` })
    }

    // Verificar unicidad de slug y email en paralelo
    const [slugExists, emailExists] = await Promise.all([
      app.prisma.business.findUnique({ where: { slug } }),
      app.prisma.user.findFirst({ where: { email } }),
    ])

    if (slugExists)  return reply.status(409).send({ error: 'slug_taken' })
    if (emailExists) return reply.status(409).send({ error: 'email_taken' })

    const passwordHash = await hashPassword(password)

    // Crear Business + User en una transacción
    const { business, user } = await app.prisma.$transaction(async (tx) => {
      const business = await tx.business.create({
        data: { slug, name: businessName },
      })

      const user = await tx.user.create({
        data: {
          businessId:   business.id,
          email,
          passwordHash,
          role:         'OWNER',
        },
      })

      return { business, user }
    })

    // Login automático — emitir tokens
    const accessToken = app.jwt.sign({
      sub:        user.id,
      businessId: business.id,
      role:       user.role,
    })

    const pair = await issueRefreshToken(app.prisma, {
      userId:    user.id,
      userAgent: req.headers['user-agent'] ?? undefined,
      ipAddress: req.ip,
    })

    setAuthCookies(reply, {
      accessToken,
      refreshToken: pair.refreshTokenRaw,
      csrfToken:    pair.csrfToken,
    })

    // Enviar email de verificación auto (best-effort, no bloquea el signup)
    try {
      const rawToken  = crypto.randomBytes(32).toString('base64url')
      const expiresAt = new Date(Date.now() + env.EMAIL_VERIFICATION_TTL_HOURS * 60 * 60 * 1000)
      await app.prisma.emailVerificationToken.create({
        data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt },
      })
      await sendVerificationEmail({
        to:             user.email,
        verifyLink:     `${env.PANEL_URL}/verify-email?token=${rawToken}`,
        expiresInHours: env.EMAIL_VERIFICATION_TTL_HOURS,
      })
    } catch (err) {
      app.log.error({ err, userId: user.id }, 'failed to send verification email on register')
    }

    return reply.status(201).send({
      user: {
        id:         user.id,
        email:      user.email,
        role:       user.role,
        businessId: business.id,
      },
      business: {
        id:   business.id,
        slug: business.slug,
        name: business.name,
      },
    })
  })
}
