import type { FastifyInstance } from 'fastify'
import { ANNOUNCEMENT_QUEUE } from '../../../workers/announcement.worker.js'
import {
  generateAnnouncementVariants,
  AiNotConfiguredError,
  type GenerateInput,
} from '../../../services/announcement-ai.service.js'

interface AnnouncementCreateBody {
  text:         string
  template?:    string
  productIds?:  string[]
  imageUrl?:    string
  scheduledAt?: string  // ISO datetime
  sendNow?:     boolean // true = encolar inmediato, false/undefined = DRAFT
}

interface AnnouncementUpdateBody {
  text?:        string
  template?:    string
  productIds?:  string[]
  imageUrl?:    string
  scheduledAt?: string | null
}

interface AnnouncementParams { id: string }

export async function ownerAnnouncementRoutes(app: FastifyInstance) {

  // ── GET / — listar anuncios del negocio (paginado, último primero) ─────────
  app.get<{ Querystring: { limit?: string; status?: string } }>('/', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-announcements'],
      summary:  'Listar anuncios del negocio',
      security: [{ bearerAuth: [] }],
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const limit  = Math.min(parseInt(req.query.limit ?? '50', 10) || 50, 200)
    const status = req.query.status

    const items = await app.prisma.announcement.findMany({
      where: {
        businessId,
        ...(status ? { status: status as 'DRAFT' | 'SCHEDULED' | 'SENDING' | 'SENT' | 'FAILED' | 'CANCELLED' } : {}),
      },
      orderBy: { createdAt: 'desc' },
      take:    limit,
    })

    return reply.send(items.map((a) => ({
      ...a,
      scheduledAt: a.scheduledAt?.toISOString() ?? null,
      sentAt:      a.sentAt?.toISOString()      ?? null,
      createdAt:   a.createdAt.toISOString(),
      updatedAt:   a.updatedAt.toISOString(),
    })))
  })

  // ── POST / — crear anuncio (DRAFT, SCHEDULED, o enviar ahora) ──────────────
  app.post<{ Body: AnnouncementCreateBody }>('/', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-announcements'],
      summary:  'Crear anuncio (DRAFT, programado, o enviar ahora)',
      security: [{ bearerAuth: [] }],
      body: {
        type:       'object',
        required:   ['text'],
        properties: {
          text:        { type: 'string', minLength: 1, maxLength: 4096 },
          template:    { type: 'string', maxLength: 50 },
          productIds:  { type: 'array', items: { type: 'string' }, maxItems: 50 },
          imageUrl:    { type: 'string', maxLength: 500 },
          scheduledAt: { type: 'string', format: 'date-time' },
          sendNow:     { type: 'boolean' },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })
    if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

    const { text, template, productIds, imageUrl, scheduledAt, sendNow } = req.body
    const scheduledDate = scheduledAt ? new Date(scheduledAt) : null

    // Status inicial
    let initialStatus: 'DRAFT' | 'SCHEDULED' | 'SENDING' = 'DRAFT'
    if (sendNow) initialStatus = 'SENDING'
    else if (scheduledDate && scheduledDate > new Date()) initialStatus = 'SCHEDULED'

    const announcement = await app.prisma.announcement.create({
      data: {
        businessId,
        text,
        template:   template      ?? null,
        productIds: productIds    ?? [],
        imageUrl:   imageUrl      ?? null,
        scheduledAt: scheduledDate,
        status:     initialStatus,
      },
    })

    // Encolar job si corresponde
    if (sendNow || (scheduledDate && scheduledDate > new Date())) {
      const delay = scheduledDate && !sendNow
        ? Math.max(0, scheduledDate.getTime() - Date.now())
        : 0

      const job = await app.queue.add(
        'publish',
        { businessId, text, announcementId: announcement.id },
        {
          attempts: 3,
          backoff:  { type: 'exponential', delay: 2000 },
          delay,
        },
      )

      await app.prisma.announcement.update({
        where: { id: announcement.id },
        data:  { jobId: job.id ?? null },
      })
    }

    return reply.status(201).send({
      ...announcement,
      scheduledAt: announcement.scheduledAt?.toISOString() ?? null,
      sentAt:      null,
      createdAt:   announcement.createdAt.toISOString(),
      updatedAt:   announcement.updatedAt.toISOString(),
    })
  })

  // ── POST /:id/send — enviar ahora un DRAFT o SCHEDULED ─────────────────────
  app.post<{ Params: AnnouncementParams }>('/:id/send', {
    onRequest: [app.authenticate],
    schema: { tags: ['owner-announcements'], summary: 'Enviar anuncio ahora' },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const a = await app.prisma.announcement.findFirst({
      where: { id: req.params.id, businessId },
    })
    if (!a) return reply.status(404).send({ error: 'not_found' })
    if (a.status !== 'DRAFT' && a.status !== 'SCHEDULED' && a.status !== 'FAILED') {
      return reply.status(409).send({ error: 'invalid_status_for_send' })
    }

    // Si tenía un job programado, cancelarlo
    if (a.jobId) {
      try { await app.queue.getJob(a.jobId).then((j) => j?.remove()) } catch { /* noop */ }
    }

    const job = await app.queue.add(
      'publish',
      { businessId, text: a.text, announcementId: a.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    )

    await app.prisma.announcement.update({
      where: { id: a.id },
      data:  { status: 'SENDING', jobId: job.id ?? null, errorMessage: null },
    })

    return reply.send({ ok: true, jobId: job.id })
  })

  // ── PATCH /:id — editar anuncio DRAFT/SCHEDULED ────────────────────────────
  app.patch<{ Params: AnnouncementParams; Body: AnnouncementUpdateBody }>('/:id', {
    onRequest: [app.authenticate],
    schema: {
      tags:     ['owner-announcements'],
      summary:  'Editar anuncio (solo DRAFT o SCHEDULED)',
      body: {
        type:       'object',
        properties: {
          text:        { type: 'string', minLength: 1, maxLength: 4096 },
          template:    { type: 'string', maxLength: 50 },
          productIds:  { type: 'array', items: { type: 'string' }, maxItems: 50 },
          imageUrl:    { type: 'string', maxLength: 500 },
          scheduledAt: { type: ['string', 'null'], format: 'date-time' },
        },
      },
    },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const a = await app.prisma.announcement.findFirst({
      where: { id: req.params.id, businessId },
    })
    if (!a) return reply.status(404).send({ error: 'not_found' })
    if (a.status !== 'DRAFT' && a.status !== 'SCHEDULED') {
      return reply.status(409).send({ error: 'invalid_status_for_edit' })
    }

    const updated = await app.prisma.announcement.update({
      where: { id: a.id },
      data: {
        ...(req.body.text        !== undefined ? { text:        req.body.text        } : {}),
        ...(req.body.template    !== undefined ? { template:    req.body.template    } : {}),
        ...(req.body.productIds  !== undefined ? { productIds:  req.body.productIds  } : {}),
        ...(req.body.imageUrl    !== undefined ? { imageUrl:    req.body.imageUrl    } : {}),
        ...(req.body.scheduledAt !== undefined
            ? { scheduledAt: req.body.scheduledAt ? new Date(req.body.scheduledAt) : null }
            : {}),
      },
    })

    return reply.send({
      ...updated,
      scheduledAt: updated.scheduledAt?.toISOString() ?? null,
      sentAt:      updated.sentAt?.toISOString()      ?? null,
      createdAt:   updated.createdAt.toISOString(),
      updatedAt:   updated.updatedAt.toISOString(),
    })
  })

  // ── DELETE /:id — cancelar (solo DRAFT/SCHEDULED) ──────────────────────────
  app.delete<{ Params: AnnouncementParams }>('/:id', {
    onRequest: [app.authenticate],
    schema: { tags: ['owner-announcements'], summary: 'Cancelar anuncio (DRAFT o SCHEDULED)' },
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })

    const a = await app.prisma.announcement.findFirst({
      where: { id: req.params.id, businessId },
    })
    if (!a) return reply.status(404).send({ error: 'not_found' })
    if (a.status !== 'DRAFT' && a.status !== 'SCHEDULED') {
      return reply.status(409).send({ error: 'invalid_status_for_cancel' })
    }

    // Cancelar job programado si existe
    if (a.jobId) {
      try { await app.queue.getJob(a.jobId).then((j) => j?.remove()) } catch { /* noop */ }
    }

    await app.prisma.announcement.update({
      where: { id: a.id },
      data:  { status: 'CANCELLED' },
    })

    return reply.status(204).send()
  })

  // Legacy compat: el cliente viejo manda body { text } sin sendNow
  // Lo mantengo handler arriba (POST /) que ya hace lo correcto si sendNow=true
  // Pero el cliente actual del panel manda sin sendNow ni scheduledAt — para él
  // exponemos un endpoint /publish que crea + envía inmediato.
  app.post<{ Body: { text: string } }>('/publish', {
    onRequest: [app.authenticate],
    schema: {
      tags:    ['owner-announcements'],
      summary: 'LEGACY — crear y enviar anuncio inmediato',
      body: {
        type:       'object',
        required:   ['text'],
        properties: { text: { type: 'string', minLength: 1, maxLength: 4096 } },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })
    if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

    const announcement = await app.prisma.announcement.create({
      data: {
        businessId,
        text:   req.body.text,
        status: 'SENDING',
      },
    })

    const job = await app.queue.add(
      'publish',
      { businessId, text: req.body.text, announcementId: announcement.id },
      { attempts: 3, backoff: { type: 'exponential', delay: 2000 } },
    )

    await app.prisma.announcement.update({
      where: { id: announcement.id },
      data:  { jobId: job.id ?? null },
    })

    return reply.status(202).send({ jobId: job.id, queue: ANNOUNCEMENT_QUEUE, announcementId: announcement.id })
  })

  // ── POST /ai-generate — generar variantes con IA (Claude) ──────────────────
  app.post<{ Body: AiGenerateBody }>('/ai-generate', {
    onRequest: [app.authenticate],
    config: { rateLimit: { max: 20, timeWindow: '1 hour' } },
    schema: {
      tags:    ['owner-announcements'],
      summary: 'Generar variantes de anuncio con IA',
      body: {
        type:       'object',
        required:   ['type', 'tone'],
        properties: {
          type:         { type: 'string', enum: ['offer', 'fresh', 'reminder', 'thank-you', 'daily', 'custom'] },
          tone:         { type: 'string', enum: ['casual', 'formal', 'friendly'] },
          productIds:   { type: 'array', items: { type: 'string' }, maxItems: 10 },
          customPrompt: { type: 'string', maxLength: 500 },
        },
      },
    },
    attachValidation: true,
  }, async (req, reply) => {
    const { businessId } = req.user
    if (!businessId) return reply.status(403).send({ error: 'forbidden' })
    if (req.validationError) return reply.status(422).send({ error: 'validation_error' })

    const business = await app.prisma.business.findUnique({ where: { id: businessId } })
    if (!business) return reply.status(404).send({ error: 'business_not_found' })

    // Build product list para el prompt
    let products: GenerateInput['products'] = []
    if (req.body.productIds?.length) {
      const dbProducts = await app.prisma.product.findMany({
        where: {
          id:         { in: req.body.productIds },
          businessId,
          isActive:   true,
        },
        include: { inventory: { select: { quantityAvailable: true } } },
      })
      products = dbProducts.map((p) => ({
        name:  p.name,
        price: Number(p.unitPrice),
        unit:  p.unitLabel,
        stock: p.inventory?.quantityAvailable,
      }))
    }

    // Next pickup window
    const nextWindow = await app.prisma.pickupWindow.findFirst({
      where: {
        businessId,
        isOpen: true,
        date:   { gte: new Date(new Date().toISOString().slice(0, 10)) },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
    })

    const catalogUrl = `https://${business.slug}.colacero.com`

    try {
      const result = await generateAnnouncementVariants({
        businessName: business.name,
        type:         req.body.type,
        tone:         req.body.tone,
        products,
        pickupWindow: nextWindow
          ? {
              date:      nextWindow.date.toISOString().slice(0, 10),
              startTime: nextWindow.startTime,
              endTime:   nextWindow.endTime,
            }
          : null,
        catalogUrl,
        customPrompt: req.body.customPrompt,
      })
      return reply.send(result)
    } catch (err) {
      if (err instanceof AiNotConfiguredError) {
        return reply.status(503).send({ error: 'ai_not_configured', message: 'Configurá ANTHROPIC_API_KEY en el server para activar IA.' })
      }
      app.log.error({ err }, 'AI generation failed')
      return reply.status(500).send({ error: 'ai_generation_failed' })
    }
  })
}

interface AiGenerateBody {
  type:         'offer' | 'fresh' | 'reminder' | 'thank-you' | 'daily' | 'custom'
  tone:         'casual' | 'formal' | 'friendly'
  productIds?:  string[]
  customPrompt?: string
}
