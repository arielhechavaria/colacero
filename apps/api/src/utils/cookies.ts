import type { FastifyReply } from 'fastify'
import { env } from '@colacero/env'
import { ACCESS_COOKIE, REFRESH_COOKIE, CSRF_COOKIE } from '../services/token.service.js'

const ACCESS_MAX_AGE_S  = 15 * 60
const REFRESH_MAX_AGE_S = env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60

const baseCookie = {
  httpOnly: true,
  secure:   env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  path:     '/',
}

export interface SetAuthCookiesArgs {
  accessToken:  string
  refreshToken: string
  csrfToken:    string
}

export function setAuthCookies(reply: FastifyReply, args: SetAuthCookiesArgs): void {
  reply.setCookie(ACCESS_COOKIE, args.accessToken, {
    ...baseCookie,
    maxAge: ACCESS_MAX_AGE_S,
  })
  reply.setCookie(REFRESH_COOKIE, args.refreshToken, {
    ...baseCookie,
    maxAge: REFRESH_MAX_AGE_S,
  })
  reply.setCookie(CSRF_COOKIE, args.csrfToken, {
    ...baseCookie,
    httpOnly: false, // frontend reads it
    maxAge:   ACCESS_MAX_AGE_S,
  })
}

export function clearAuthCookies(reply: FastifyReply): void {
  reply.clearCookie(ACCESS_COOKIE,  { path: '/' })
  reply.clearCookie(REFRESH_COOKIE, { path: '/' })
  reply.clearCookie(CSRF_COOKIE,    { path: '/' })
}
